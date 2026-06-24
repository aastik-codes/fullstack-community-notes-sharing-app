import user from "../model/user.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

export async function signup(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    } else if (!email.includes("@")) {
        return res.status(400).json({ message: "Invalid email" });
    } else if (password.length < 6) {
        return res.status(400).json({ message: "Password too short" });
    }

    const existinguser = await user.findOne({ email: email })
    if (existinguser) {
        return res.status(400).json({ message: "Email already registered" })
    }

    let hashedpass = await bcrypt.hash(password, 10);
    let newUser = new user({
        username: username,
        email: email,
        password: hashedpass
    })

    try {
        await newUser.save()
        console.log("user saved")
        res.send("user added")
    } catch (err) {
        res.status(500).json({ message: "Error occurred", error: err }) 
    }
}

export async function login(req, res) {
    const { email, password } = req.body

    let found = await user.findOne({ email: email })
    if (found) {
        let isMatch = await bcrypt.compare(password, found.password);
        if (isMatch) {
            let token = jwt.sign(         
                { userID: found._id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            )
            res.send(token)               
        } else {
            res.send("Password or email was wrong, please try again.")
        }
    } else {
        res.status(404).json({ message: "User not found" })
    }
}                                         

export async function forgot(req, res) {
    const { email } = req.body
    let found = await user.findOne({ email: email })

    if (found) {
        let token = crypto.randomBytes(20).toString("hex")
        found.token = token
        found.tokenExpiry = Date.now() + 60 * 60 * 1000
        await found.save()

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,   
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,       
            to: found.email,
            subject: "Password reset request",
            text: `Your reset token is ${token}`
        });

        res.send("Email sent!")
    } else {
        return res.send("Email not registered, try again.")
    }
}

export async function updatepass(req, res) {
    const { token, newpass } = req.body || {};
    let found = await user.findOne({ token: token })

    if (found) {
        if (found.tokenExpiry > Date.now()) {
            found.password = await bcrypt.hash(newpass, 10)
            found.token = undefined
            found.tokenExpiry = undefined
            await found.save()
            res.send('Password updated')
        } else {
            return res.send("Token expired, please request another one")
        }
    } else {
        return res.send("Incorrect token")
    }
}                                      