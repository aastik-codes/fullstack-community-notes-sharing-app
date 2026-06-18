import cloudinary from '../config/cloudinary.js'
import express from 'express';
import { authMiddleware } from '../middleware/authMIddleware.js';
import upload from '../config/multer.js';
import { uploadfile,GetNotesone, GetNotesAll, DeleteOne} from '../controllers/notescontrollers.js';

const Nrouter = express.Router()
Nrouter.use(authMiddleware)


Nrouter.get("/user/notes/test",(req,res)=>{
    let a = cloudinary.config()
    res.send(a)
})

Nrouter.post('/user/upload', upload.single('note'), (req, res) => {
    uploadfile(req, res)
})


Nrouter.get('/user/notes/getnotesall',(req,res)=>{
    GetNotesAll(req,res)
})


Nrouter.get('/user/notes/getnotesone',(req,res)=>{
    GetNotesone(req,res)
})

Nrouter.get('/user/notes/Deleteone',(req,res)=>{
    DeleteOne(req,res)
})
export default Nrouter
