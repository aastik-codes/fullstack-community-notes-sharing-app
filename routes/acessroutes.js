import express from 'express'
import { authMiddleware } from '../middleware/authMIddleware.js'
import {AddAccess,RemoveAccess,ChangeVisibility} from '../controllers/accessController.js'
const Arouter = express.Router()
Arouter.use(authMiddleware)

Arouter.post(
    '/user/access/add',
    (req,res)=>{
        AddAccess(req,res)
    }
)

Arouter.post(
    '/user/access/remove',
    (req,res)=>{
        RemoveAccess(req,res)
    }
)

Arouter.post(
    '/user/access/visibility',
    (req,res)=>{
        ChangeVisibility(req,res)
    }
)

export default Arouter