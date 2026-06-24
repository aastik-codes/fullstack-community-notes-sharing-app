import express from 'express';
import { healthcheck } from '../controllers/controllers.js';
const router =  express.Router()

router.get('/',(req,res)=>{
    healthcheck(req,res)
});

export default router