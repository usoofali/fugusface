const mongosse = require('mongoose');

const tokenSchema = new mongosse.Schema({
    email: { 
        type: String,
         required: true,
        },
    password: {
        type: String,
        minlength: [8,'min length of password must be 8'],
        required: true,
    },
    token: { 
        type: String,
         required: true 
        },
    createdAt: { 
        type: Date,
         required: true, 
         default: Date.now,
          expires: 43200 
        }
});

module.exports = new mongosse.model("ForgetPasswordToken",tokenSchema);