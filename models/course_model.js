const mongosse = require('mongoose');
const Schema = mongosse.Schema;
const course_Schema = new Schema({
course_id: {type: String,unique:true},
course_code: String,
name: String,
admin_id: String,
sessioncount: Number,
session: Number,
enrollCode:Number,
allowEnroll:Boolean,
attendance:
{
    type: Array,
    of: {
        Id:{type:mongosse.Types.ObjectId},
        name:String,
        regno:String,
        attendance:Number,
        marked:Boolean,
        features:Array,
    }
}
})
module.exports = mongosse.model('course', course_Schema)
