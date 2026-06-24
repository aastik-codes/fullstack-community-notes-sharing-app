import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { canAccessNote } from '../middleware/accessMiddleware.js'
import { RateNote } from '../controllers/ratingController.js'

const router = express.Router()

router.use(authMiddleware)

router.post('/user/notes/rate', canAccessNote, RateNote)

export default router