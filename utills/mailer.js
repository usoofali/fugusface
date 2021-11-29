exports.codeMailer = function (email, name, course_n, course_i, code) {
  require('dotenv').config();
  const mg = require('nodemailer-mailgun-transport');
  var nodemailer = require('nodemailer')

  const auth = {
    auth: {
      api_key: process.env.API_KEY,
      domain: process.env.DOMAIN
    }
  }

  const nodemailerMailgun = nodemailer.createTransport(mg(auth));
  
  nodemailerMailgun.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: 'Course ' + course_n + " added",
    text: "Hello, " + name + "\n\n" +
      "Your course " + course_i + ": " + course_n + ", is added successfully please share the following code with your students to eroll with: " + code +
      "\n\n" + "Regards," + "\n" + "AMS Fugus Team"
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
          msg: 'verification email sent'
      });
  }
  });
  

}
