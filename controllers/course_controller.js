const Excel = require('exceljs');
const course_model = require('../models/course_model');
const mg = require('nodemailer-mailgun-transport');
const nodemailer = require("nodemailer");
const student_model = require('../models/student_model');
const lecturer_model = require('../models/lecturer_model');
const mongosse = require('mongoose');
const { enroll } = require('./student_controller');

module.exports = {
    create: async (req, res) => {
        try{
        const enroll_code=Math.floor(100000 + Math.random() * 900000)
        var lecturerId = mongosse.Types.ObjectId(req.body.admin_id)
        const lecturer = await lecturer_model.find({_id:lecturerId})
        let course = new course_model({
        course_id:req.body.course_id +"#"+lecturer[0].email,
        course_code:req.body.course_id,
        name: req.body.name,
        admin_id: mongosse.Types.ObjectId(req.body.admin_id),
        sessioncount:0,
        session: 0,
        allowEnroll:true,
        enrollCode:enroll_code
        })
	const admin = await lecturer_model.findById(mongosse.Types.ObjectId(req.body.admin_id))
        const result= await course.save(function async (err) {
		if (err) {
            console.log(err);
            res.status(500).json({
                err: true,
                msg: "Course already added."
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
   	 to: admin.email,
   	 subject:  req.body.name + " added",
    	text: "Hello, " + admin.name + "\n\n" +
      "Your course " + req.body.course_id + ": " + req.body.name + ", is added successfully please share the following code with your students to eroll with: " + enroll_code +
      "\n\n" + "Regards," + "\n" + "AMS Fugus Team"
  }, (err, info) => {
    if (err) {
      console.log(error);
      res.status(500).json({
          err: true,
          msg: "Course added but failed to send email."
      });
  }
  else {
      console.log('Email sent');
      res.status(200).json({
          err: false,
          msg: 'Course added successfully, check your email for enrol code.'
      });
  }
  });
		}
	})
      }
    
        catch(err) {
          console.log(err)
          res.status(501).json({ success: false, message:"Something went wrong"})
            }
    },
    
    close:async(req, res) => {
      try {
        var c_id= mongosse.Types.ObjectId(req.params.c_id)
        course_model.findByIdAndUpdate(c_id,{$set:{allowEnroll:false}})
        res.status(200).json({success:true,message: "enrollment closed"})
      }
      catch (err)
      {
        console.log(err)
        res.status(501).json({ success: false, message:"Something went wrong"})
      }
},
   
    get: async (req, res) =>{
        try
        {
	console.log(req.params)
        const result= await course_model.find({admin_id:req.params.id})
	for(i=0; i< result.length; i++){
          result[i]['attendance'] = [];
        }
	console.log(result)
        res.status(200).json({ success: true, result:result})
    }
          catch(err){
            console.log(err)
            res.status(501).json({ success: false, message:"Something went wrong"})
          }
        },

    enrollhandler: async (req, res) => {
      
        try{

        var id = mongosse.Types.ObjectId(req.params.c_id)
        if(req.params.allow == "true"){
        var allow = true
	}
        else{
	var allow = false}
console.log(allow)
        await course_model.findByIdAndUpdate(id, {$set:{allowEnroll:allow}})
       console.log("Hello")
 	res.status(200).json({ success: true, message:"Successful."})
      }
      catch(err) {
	console.log(err)
          res.status(501).json({ success: false, message:"Something went wrong"})
      }
    },

    start_session: async (req, res) => {
        try{
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
              }
            var code=Math.floor(100000 + Math.random() * 900000)
            var id= mongosse.Types.ObjectId(req.params.id)
            await course_model.findByIdAndUpdate(id, {$set:{session:code,"attendance.$[].marked":false}})
            console.log("Lecture session started succesfully.")
            console.log('Session Code: '+code)
            res.status(200).json({ success: true, result:code})
    }
      catch(err) {
        console.log(err)
          res.status(501).json({ success: false, message:"Something went wrong"})
      }
    },
     stop_session: async (req, res) => {
      try{
            var id= mongosse.Types.ObjectId(req.params.id)
            await course_model.findByIdAndUpdate(id, {$inc:{sessioncount:1}})
            await course_model.findByIdAndUpdate(id, {$set:{session:0}})
            res.status(200).json({ success: true, result:code})
    }
      catch(err) {
        console.log(err)
        res.status(501).json({ success: false, message:"Something went wrong"})
      }
    },

     delete: async (req,res)=> {
        try{
            var id= mongosse.Types.ObjectId(req.params.id)
            const result=await course_model.findByIdAndDelete(id)
            res.status(200).json({ success: true, result: result})
        }
          catch(err){
            console.log(err)
            res.status(501).json({ success: false, message:"Something went wrong"})
        }
        },

    course_export: async (req,res)=> {
      try{
        var c_id= mongosse.Types.ObjectId(req.params.id)
        const all  = await course_model.find({_id:c_id})
        var data = []
        for(i in all[0].attendance)
        {
          const stud=await student_model.find({_id:all[0].attendance[i].Id})
          if(all[0].sessioncount !==0)
          {
            var num=Number((all[0].attendance[i].attendance)/(all[0].sessioncount)*100)
          }
          else{
            var num = 0
          }
          data.push({regno:all[0].attendance[i].regno,name:stud[0].name, email:stud[0].email, attendance:num})
        }
        if (data.length > 0){

          const filename = 'Attendance_report_'+all[0].course_id +'.xlsx';
          let workbook = new Excel.Workbook();
          let worksheet = workbook.addWorksheet('Attendance');
          worksheet.columns = [
            {header: 'Registration Number', key: 'regno'},
            {header: 'Name', key: 'name'},
            {header: 'Email Address', key: 'email'},
            {header: 'Attendance Percentage (%)', key: 'attendance'},
              ]; 
          data.forEach((e) => {
          worksheet.addRow(e);
          });

          const buffer = await workbook.xlsx.writeBuffer();
          var lecturerId = mongosse.Types.ObjectId(all[0].admin_id)
          const lecturer = await lecturer_model.find({_id:lecturerId})
          const auth = {
                auth: {
                  api_key: process.env.API_KEY,
                  domain: process.env.DOMAIN
                }
              }
          const nodemailerMailgun = nodemailer.createTransport(mg(auth));
          nodemailerMailgun.sendMail({
                from: process.env.EMAIL,
                to: lecturer[0].email,
                subject: all[0].course_id +' Attendance Report',
                attachments: [{
                filename,
                content: buffer,
                contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}],
                text: "Hello, " + lecturer[0].name + "\n\n" +
                "Kindly find attached the attendance report for the course " + all[0].course_id + ": " + all[0].name + ". " + 
                "\n\n" + "Regards," + "\n" + "AMS Fugus Team"
              },(err) => {
                if (err) {
                    console.log(error);
                    res.status(500).json({
                        err: true,
                        result: "OOPS! Some Error occurred.Please try again"
                    });
                }
                else {
                  console.log('Email sent');                    
                  res.status(200).json({success: true,result:"Students data exported to "+ lecturer[0].email})
                  }
                });
          }
          else
          {
            res.status(200).json({success: true,result:"No student record found."})
          }
      }
      catch(err){
        console.log(err)
        res.status(501).json({ success: false, result:"Something went wrong"})
    }
    },

    course_home: async (req,res)=> {
      try{
        var c_id= mongosse.Types.ObjectId(req.params.id)
        const all  = await course_model.find({_id:c_id})
        var name_arr=[]
        var username_arr=[]
        var regno_arr=[]
        var attendance_arr=[]
        for(i in all[0].attendance)
        {
          const stud=await student_model.find({_id:all[0].attendance[i].Id})
          username_arr.push(stud[0].username)
          name_arr.push(all[0].attendance[i].name)
          regno_arr.push(all[0].attendance[i].regno)
          if(all[0].sessioncount !==0)
          {
          var num=Number(all[0].attendance[i].attendance)/(all[0].sessioncount)
          attendance_arr.push(Number(num.toPrecision(4)))
          }
          else{
            attendance_arr.push(0)
          }
        }
          res.status(200).json({name:name_arr,
                                regno:regno_arr,
                                username:username_arr,
                                attendance:attendance_arr})
      }
      catch(err){
        console.log(err)
        res.status(501).json({ success: false, message:"Something went wrong"})
    }
    },

    course_verification: async (req,res)=> {
      try{
        var c_id= mongosse.Types.ObjectId(req.params.id)
        const all  = await course_model.find({_id:c_id})
        var regno_arr=[]
        var features_arr=[]
        var id_arr=[]
        for(i in all[0].attendance)
        {
          id_arr.push(all[0].attendance[i].Id)
          regno_arr.push(all[0].attendance[i].regno)
          features_arr.push(all[0].attendance[i].features)
        }
          res.status(200).json({id:id_arr,
                                regno:regno_arr,
                              features:features_arr})
      }
      catch(err){
        console.log(err)
        res.status(501).json({ success: false, message:"Something went wrong"})
    }
    },

}
