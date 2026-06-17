import notes from '../model/notes.js'
import cloudinary from '../config/cloudinary.js'
import upload from '../config/multer.js';




export async function uploadfile(req,res){
    try {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    res.status(200).json({
        message: 'Upload successful',
      url: req.file.path,       // Cloudinary secure URL
        public_id: req.file.filename,
    });
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
}