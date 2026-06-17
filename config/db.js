import dotenv from 'dotenv'
dotenv.config();
import mongoose from 'mongoose';

export async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log('connected to MongoDb')
    }catch(err){
        console.error(err)
        process.exit(1)
    }
}