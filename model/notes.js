const { access } = require("node:fs");

const {schema} = mongoose

const userSchema = new Schema({
    rating:{type:Number,default:0},
    access: [{type:String}],
    noteUrl:{
        type: String,
        required:true
    },
    user:{
        type:schema.Types.ObjectId,
        ref: "user",
        required: true
    }

});



module.exports = mongoose.model('Note',userSchema);