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
const upload = multer({
    storage,
    limits:{fileSize:20*1024*1024} // i set the file size limit here

})

export default upload


