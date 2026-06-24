
import mongoose from 'mongoose';
const {Schema} = mongoose

const userSchema = new Schema({

    username: {type: String,required:true},
    email: {type: String, required: true, map:/@/},
    password: {type: String , required:true},
    Rating : {type:Number, default:0},
    Notes:[{type: mongoose.Schema.Types.ObjectId, ref:"Note",}],
    token:{type:String},
    tokenExpiry:{type: Date}

    
})


export default mongoose.model("User",userSchema)