import user from '../model/user.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

function cleanEmail(email = '') {
    return email.trim().toLowerCase()
}

export async function signup(req, res) {
    try {
        const username = req.body.username?.trim()
        const email = cleanEmail(req.body.email)
        const password = req.body.password

        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            })
        }

        if (!email.includes('@')) {
            return res.status(400).json({
                message: 'Invalid email'
            })
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password too short'
            })
        }

        const existingUser = await user.findOne({ email })

        if (existingUser) {
            return res.status(400).json({
                message: 'Email already registered'
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await user.create({
            username,
            email,
            password: hashedPassword
        })

        res.status(201).json({
            message: 'User created',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                rating: newUser.Rating
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Error occurred'
        })
    }
}

export async function login(req, res) {
    try {
        const email = cleanEmail(req.body.email)
        const password = req.body.password

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            })
        }

        const foundUser = await user.findOne({ email })

        if (!foundUser) {
            return res.status(401).json({
                message: 'Invalid email or password'
            })
        }

        const isMatch = await bcrypt.compare(password, foundUser.password)

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            })
        }

        const token = jwt.sign(
            { userID: foundUser._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        )

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: foundUser._id,
                username: foundUser.username,
                email: foundUser.email,
                rating: foundUser.Rating
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}

export async function forgot(req, res) {
    try {
        const email = cleanEmail(req.body.email)

        if (!email) {
            return res.status(400).json({
                message: 'Email is required'
            })
        }

        const foundUser = await user.findOne({ email })

        if (!foundUser) {
            return res.status(404).json({
                message: 'Email not registered'
            })
        }

        const resetToken = crypto.randomBytes(20).toString('hex')

        foundUser.token = resetToken
        foundUser.tokenExpiry = Date.now() + 60 * 60 * 1000
        await foundUser.save()

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: foundUser.email,
            subject: 'Password reset request',
            text: `Your reset token is ${resetToken}`
        })

        res.status(200).json({
            message: 'Email sent!'
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Could not send reset email'
        })
    }
}

export async function updatepass(req, res) {
    try {
        const token = req.body.token?.trim()
        const newpass = req.body.newpass

        if (!token || !newpass) {
            return res.status(400).json({
                message: 'Token and new password are required'
            })
        }

        if (newpass.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters'
            })
        }

        const foundUser = await user.findOne({ token })

        if (!foundUser) {
            return res.status(400).json({
                message: 'Incorrect token'
            })
        }

        if (!foundUser.tokenExpiry || foundUser.tokenExpiry <= Date.now()) {
            return res.status(400).json({
                message: 'Token expired, please request another one'
            })
        }

        foundUser.password = await bcrypt.hash(newpass, 10)
        foundUser.token = undefined
        foundUser.tokenExpiry = undefined
        await foundUser.save()

        res.status(200).json({
            message: 'Password updated'
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}
