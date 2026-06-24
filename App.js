import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

import { connectDB } from './config/db.js'

import HealthRoutes  from './routes/routes.js'
import authRoutes    from './routes/authRoutes.js'
import Userroutes   from './routes/userRoutes.js'
import Nrouter      from './routes/noteRoutes.js'
import Arouter      from './routes/accessRoutes.js'
import Rrouter      from './routes/ratingRoutes.js'
import Crouter      from './routes/commentRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const app = express()

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/', HealthRoutes)
app.use('/', authRoutes)
app.use('/', Userroutes)
app.use('/', Nrouter)
app.use('/', Arouter)
app.use('/', Rrouter)
app.use('/', Crouter)

// ── SPA fallback — serve index for any unmatched non-API GET ───────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '01-auth.html'))
})

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' })
})

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
}).catch(err => {
    console.error('DB connection failed, server not started:', err)
    process.exit(1)
})

export default app