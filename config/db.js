import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

export async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('connected to MongoDb')
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}