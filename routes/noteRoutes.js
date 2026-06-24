import cloudinary from '../config/cloudinary.js'
import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import upload from '../config/multer.js'

import {
    uploadfile,
    GetNotesone,
    GetNotesAll,
    DeleteOne,
    SearchNotes
} from '../controllers/noteController.js'

import { canAccessNote } from '../middleware/accessMiddleware.js'

const Nrouter = express.Router()

Nrouter.use(authMiddleware)


Nrouter.get("/user/notes/test", (req, res) => {
    let a = cloudinary.config()

    res.send(a)
})


Nrouter.post(
    '/user/upload',
    upload.single('note'),
    (req, res) => {
        uploadfile(req, res)
    }
)


Nrouter.get(
    '/user/notes/getnotesall',
    (req, res) => {
        GetNotesAll(req, res)
    }
)


Nrouter.get(
    '/user/notes/getnotesone',
    canAccessNote,
    (req, res) => {
        GetNotesone(req, res)
    }
)


Nrouter.delete(
    '/user/notes/Deleteone',
    (req, res) => {
        DeleteOne(req, res)
    }
)


Nrouter.get(
    '/user/notes/search',
    (req, res) => {
        SearchNotes(req, res)
    }
)


export default Nrouter