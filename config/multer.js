import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";
import multer from "multer";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'notes',
        resource_type: 'auto',
        allowed_formats: ['pdf']
    }
});
// storage stores two things 1) where to send the file? cloudinary our cloduinary account
// 2) what is allowed to go 
const upload = multer({
    storage,
    limits:{fileSize:20*1024*1024} // i set the file size limit here

})

//  creates a object which has various methods , 
// multer sends back an object  that is stored in upload , multer  function takes the arguments here about where it  will be sent and what size is allowed .
export default upload


// 