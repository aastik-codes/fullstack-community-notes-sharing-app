import express from 'express';
import { authMiddleware } from '../middleware/authMIddleware.js';
import { Userprofile,UpdateProfile, Dashboard } from '../controllers/usercontrollers.js';
const Urouter = express.Router()
Urouter.use(authMiddleware)

Urouter.get('/user/profile',(req,res)=>{
    Userprofile(req,res)
})

Urouter.post('/user/profile/update',(req,res)=>{
    UpdateProfile(req,res)
})

Urouter.get('/user/dashboard',(req,res)=>{
    Dashboard(req,res)
}) 
export default Urouter