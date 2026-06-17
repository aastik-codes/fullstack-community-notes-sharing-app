
import express from 'express';
import HealthRoutes from './routes/routes.js'
import authRoutes from './routes/authroutes.js'
import { connectDB } from './config/db.js';
import Userroutes from './routes/UserRoutes.js'
import Nrouter from './routes/noteRoutes.js';
const app = express();
app.use(express.json());
app.use('/', HealthRoutes);
app.use('/', authRoutes);
app.use('/',Userroutes)
app.use('/',Nrouter)

app.listen(3000,()=>{
    connectDB()
    console.log("server is running on port 3000")
})

