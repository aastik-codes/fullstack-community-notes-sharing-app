import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import {
    AddAccess,
    RemoveAccess,
    ChangeVisibility
} from '../controllers/accessController.js'

const router = express.Router()

router.use(authMiddleware)

router.post('/user/access/add', AddAccess)
router.post('/user/access/remove', RemoveAccess)
router.post('/user/access/visibility', ChangeVisibility)

export default router