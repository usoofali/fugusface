require('dotenv').config();
const mg = require('nodemailer-mailgun-transport');
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
var crypto = require('crypto');
const Lecturer = require('../models/lecturer_model');
const Student = require('../models/student_model');
const Token = require('../models/tokenModel.js');
const ForgetPasswordToken = require('../models/changePasswordToken.js');
var md5 = require('md5');
var validator = require('email-validator');



function createTokenAndSendEmail(lecturerEmail, lecturerPassword, lecturerId, lecturerName, ip,res) {

    const token = crypto.randomBytes(16).toString('hex');
    console.log(token);

    const newToken = new Token({

        token: token,
        email: lecturerEmail,
        password: lecturerPassword,
        name: lecturerName,
        lecturerId: lecturerId,
    });

    newToken.save(function (err) {

        if (err) {
            console.log(err);
            res.status(500).json({
                err: true,
                msg: "OOPS! Some Error occurred.Please try again"
            });
        } else {
            
            const auth = {
                auth: {
                  api_key: process.env.API_KEY,
                  domain: process.env.DOMAIN
                }
              }
            
              const nodemailerMailgun = nodemailer.createTransport(mg(auth));
            
              nodemailerMailgun.sendMail({
                from: process.env.EMAIL,
                to: lecturerEmail,
                subject: 'Account Confirmation',
                template: 'email_confirmation',
                'h:X-Mailgun-Variables': JSON.stringify({name:lecturerName,email:lecturerEmail,link:ip+ '/lecturer/verify/' + token})
              }, (err) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({
                        err: true,
                        msg: "OOPS! Some Error occurred.Please try again"
                    });
                }
                else {
                    console.log('Email sent');
                    res.status(200).json({
                        err: false,
                        msg: 'verification email sent'
                    });
                }
              });
        }

    });


}

function validateEmailAndPassword(email, password) {
    if (password.length >= 8 && validator.validate(email))
        return true;
    else
        return false;
}



router.get("/verify/:token", (req, res) => {

    console.log(req.params);

    Token.findOne({
        token: req.params.token
    }, (err, foundToken) => {

        if (err)
            res.status(500).send({
                err: true,
                msg: 'We were unable to find a valid token. Your token may have expired.'
            });
        else {
            if (foundToken) {
                const newLecturer = new Lecturer({

                    email: foundToken.email,
                    name: foundToken.name,
                    password: md5(foundToken.password),
                    lecturerId: foundToken.lecturerId,
                });

                newLecturer.save(function (err) {

                    if (err) {
                        console.log(err);
                        res.status(500).json({
                            err: true,
                            msg: "OOPS! Some Error occurred.Please try again later"
                        });
                    } else {
                        Token.deleteOne({
                            token: req.params.token
                        }, function (err, result) {

                            if (err) {
                                res.status(500).json({
                                    err: true,
                                    msg: "OOPS! Some Error occurred.Please try again later"
                                });
                            } else
                                res.status(200).send('successfully verified email');
                        })
                    }


                });




            } else
                res.status(500).send({
                    err: true,
                    msg: 'We were unable to find a valid token. Your token may have expired or your account is already verified'
                });
        }


    });


});

router.post("/login", function (req, res) {

    Lecturer.findOne({
        email: req.body.email
    }, function (err, foundLecturer) {

        if (err) {
            res.status(500).json({
                err: true,
                msg: "Some Error occurred.Please try again"
            });
        } else {
            if (foundLecturer) {
                if (foundLecturer.password == md5(req.body.password))
                    res.status(200).json({
                        err: false,
                        msg: foundLecturer._id,
                        level:1
                    });
                else {
                    res.status(400).json({
                        err: true,
                        msg: "Invalid password"
                    });
                }
            } else {
            Student.findOne({
                email: req.body.email
            }, function (err, foundStudent) {

                if (err) {
                    res.status(500).json({
                        err: true,
                        msg: "Some Error occurred.Please try again"
                    });
                } else {
                    if (foundStudent) {
                        if (foundStudent.password == md5(req.body.password))
                            res.status(200).json({
                                err: false,
                                msg: foundStudent._id,
                                level:2
                            });
                        else {
                            res.status(400).json({
                                err: true,
                                msg: "Invalid password"
                            });
                        }
                    } else {
                        res.status(400).json({
                            err: true,
                            msg: 'Unable to find a user for this email. Register and/or verify your email'
                        });
                    }
                }
            });
            }
        }
    });
});

router.post("/register", (req, res) => {

    console.log(req.body);
    console.log(Lecturer);

    if (validateEmailAndPassword(req.body.email, req.body.password)) {
        Lecturer.findOne({
            email: req.body.email
        }, (err, foundLecturer) => {
            if (err) {
                console.log(err);
                res.status(500).json({
                    err: true,
                    msg: "Some Error occurred.Please try again later"
                });
            } else {
                if (foundLecturer) {

                    res.status(400).json({
                        err: true,
                        msg: 'The email address you have entered is already associated with another lecturer account.'
                    });

                } else {
                    Student.findOne({
            email: req.body.email
        }, (err, foundStudent) => {
            if (err) {
                console.log(err);
                res.status(500).json({
                    err: true,
                    msg: "OOPS! Some Error occurred.Please try again later"
                });
            } else {
                if (foundStudent) {

                    res.status(400).json({
                        err: true,
                        msg: 'The email address you have entered is already associated with another student account.'
                    });
                } else {
                    var email = req.body.email;
                    var lecturerId = email.slice(0, email.indexOf('@'));
                    console.log(lecturerId);
                    createTokenAndSendEmail(req.body.email, req.body.password, lecturerId, req.body.name, req.body.ip,res);
                        }
                    }
                });
                }
            }
        });
    } else
        res.status(400).json({
            err: true,
            msg: "Invalid email or password."
        });


});

router.post("/resetPassword", (req, res) => {

    Lecturer.findOne({
        email: req.body.email
    }, function (err, foundLecturer) {
        if (err) {
            res.status(500).json({
                err: true,
                msg: "OOPS! Some Error occurred.Please try again"
            });
        } else {
            if (foundLecturer) {
                const tokenNum = crypto.randomBytes(16).toString('hex');
                console.log(tokenNum);
                const forgetPasswordToken = new ForgetPasswordToken({
                    token: tokenNum,
                    email: req.body.email,
                    password: md5(req.body.password),

                });
                forgetPasswordToken.save(function (err) {
                    if (err) {
                        console.log(err);
                        res.status(500).json({
                            err: true,
                            msg: "OOPS! Some Error occurred.Please try again"
                        });
                    } else {
                        const auth = {
                            auth: {
                              api_key: process.env.API_KEY,
                              domain: process.env.DOMAIN
                            }
                          }
                        
                          const nodemailerMailgun = nodemailer.createTransport(mg(auth));
                        
                          nodemailerMailgun.sendMail({
                            from: process.env.EMAIL,
                            to: req.body.email,
                            subject: 'Reset passsword',
                            text: 'To reset your account click the following link : ' + req.body.ip + '/lecturer/verifyResetPasswordRequest/' + tokenNum,
                          }, (err, info) => {
                            if (err) {
                                console.log(error);
                                res.status(500).json({
                                    err: true,
                                    msg: "OOPS! Some Error occurred.Please try again"
                                });
                            }
                            else {
                                console.log('Email sent');
                                res.status(200).json({
                                    err: false,
                                    msg: 'Reset email sent'
                                });
                            }
                          });
                    }
                })


            } else {
            Student.findOne({email: req.body.email},function(err,foundStudent){
            if(err)
            {
                res.status(500).json({err: true, msg: "OOPS! Some Error occurred.Please try again"});
            }
            else
            {
                if(foundStudent)
                {   
                    const tokenNum = crypto.randomBytes(16).toString('hex');
                    console.log(tokenNum);
                    const forgetPasswordToken = new ForgetPasswordToken({
                        token: tokenNum,
                        email: req.body.email,
                        password: md5(req.body.password),

                    });
                    forgetPasswordToken.save(function(err){
                        if(err)
                        {
                            console.log(err);
                            res.status(500).json({err: true, msg: "OOPS! Some Error occurred.Please try again"});
                        }
                        else
                        {   
                            const auth = {
                                auth: {
                                  api_key: process.env.API_KEY,
                                  domain: process.env.DOMAIN
                                }
                              }
                            
                              const nodemailerMailgun = nodemailer.createTransport(mg(auth));
                            
                              nodemailerMailgun.sendMail({
                                from: process.env.EMAIL,
                                to: req.body.email,
                                subject: 'Password Reset',
                                text: 'To reset your account click the following link :' + req.body.ip + '/student/verifyResetPasswordRequest/' + tokenNum,
                              }, (err, info) => {
                                if (err) {
                                    console.log(error);
                                    res.status(500).json({
                                        err: true,
                                        msg: "OOPS! Some Error occurred.Please try again"
                                    });
                                }
                                else {
                                    console.log('Email sent');
                                    res.status(200).json({
                                        err: false,
                                        msg: 'Reset email sent'
                                    });
                                }
                              });
                        }
                    })
                }
                else
                {
                    res.status(400).json({err: true,msg: 'Unable to find a user for this email.'});
                }
            }
            });
            }
        }
    });
});

router.get("/verifyResetPasswordRequest/:token", (req, res) => {
    console.log(req.params);

    ForgetPasswordToken.findOne({
        token: req.params.token
    }, (err, foundToken) => {

        console.log(foundToken);
        if (err)
            res.status(500).send({
                err: true,
                msg: 'We were unable to find a valid token. Your token may have expired.'
            });
        else {
            console.log(foundToken);
            if (foundToken) {
                Lecturer.findOne({
                    email: foundToken.email
                }, (err, foundLecturer) => {

                    if (err) {
                        res.status(500).send({
                            err: true,
                            msg: "OOPS! Some error occured"
                        });
                    } else {
                        foundLecturer.password = foundToken.password;
                        foundLecturer.save(function (err) {
                            if (err)
                                res.status(500).send({
                                    err: true,
                                    msg: "OOPS! Some error occured"
                                });
                            else
                                res.status(200).send({
                                    err: false,
                                    msg: "Successfully changed password"
                                });


                        })
                    }
                });

            } else
                res.status(500).send({
                    err: true,
                    msg: 'We were unable to find a valid token. Your token may have expired or your account is already verified'
                });
        }


    });
})



module.exports = router;

