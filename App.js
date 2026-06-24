import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

import { connectDB } from './config/db.js'

import HealthRoutes from './routes/routes.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import noteRoutes from './routes/noteRoutes.js'
import accessRoutes from './routes/accessRoutes.js'
import ratingRoutes from './routes/ratingRoutes.js'
import commentRoutes from './routes/commentRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

//main webpage url
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '01-auth.html'))
})

app.use('/health', HealthRoutes)
app.use('/', authRoutes)
app.use('/', userRoutes)
app.use('/', noteRoutes)
app.use('/', accessRoutes)
app.use('/', ratingRoutes)
app.use('/', commentRoutes)


app.get('*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '01-auth.html'))
})

app.use((err, req, res, next) => {
    console.error(err.stack || err)
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    })
})

const PORT = process.env.PORT || 3000

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
        })
    })
    .catch(err => {
        console.error('DB connection failed, server not started:', err)
        process.exit(1)
    })

export default app
