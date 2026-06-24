import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { canAccessNote } from '../middleware/accessMiddleware.js'
import {
    AddComment,
    GetComments,
    DeleteComment
} from '../controllers/commentController.js'

const router = express.Router()

router.use(authMiddleware)

router.post('/user/comments/add', canAccessNote, AddComment)
router.post('/user/comments/get', canAccessNote, GetComments)
router.delete('/user/comments/delete', DeleteComment)

export default router