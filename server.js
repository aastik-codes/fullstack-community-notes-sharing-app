import express from 'express';
import userRoutes from './routes/routes.js'
import authRoutes from './routes/authroutes.js'
import { connectDB } from './config/db.js';
const app = express();
app.use(express.json());
app.use('/', userRoutes);
app.use('/', authRoutes);


app.listen(3000,()=>{
    connectDB()
    console.log("server is running on port 3000")
})