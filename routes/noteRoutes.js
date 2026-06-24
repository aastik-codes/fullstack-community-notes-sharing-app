import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import upload from '../config/multer.js'
import { canAccessNote } from '../middleware/accessMiddleware.js'

import {
    uploadfile,
    GetNotesone,
    GetNotesAll,
    DeleteOne,
    SearchNotes
} from '../controllers/noteController.js'

const router = express.Router()

router.use(authMiddleware)

router.post('/user/upload', upload.single('note'), uploadfile)
router.get('/user/notes/getnotesall', GetNotesAll)
router.get('/user/notes/getnotesone/:id', canAccessNote, GetNotesone)
router.delete('/user/notes/deleteone', DeleteOne)
router.get('/user/notes/search', SearchNotes)

export default router