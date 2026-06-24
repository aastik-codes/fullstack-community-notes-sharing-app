import express from 'express'
import {
    signup,
    login,
    forgot,
    updatepass
} from '../controllers/authController.js'

const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/resetpass', forgot)
router.post('/updatepass', updatepass)
