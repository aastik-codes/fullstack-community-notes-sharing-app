import express from 'express';
const router = express.Router()
import { signup,login, forgot,updatepass } from '../controllers/authcontrollers.js';


router.post('/signup',(req,res)=>{
    signup(req,res);
}) 

router.post('/login',(req,res)=>{
    login(req,res)
})


router.post('/resetpass',(req,res)=>{
    forgot(req,res)
})

router.post('/updatepass',(req,res)=>{
    updatepass(req,res);
})
export default router 