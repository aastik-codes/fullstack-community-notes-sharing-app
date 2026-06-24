import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js"
import { canAccessNote } from "../middleware/accessMiddleware.js";

import {
    AddComment,
    GetComments,
    DeleteComment
} from "../controllers/commentController.js";

const Crouter = express.Router();

Crouter.use(authMiddleware);


Crouter.post(
    "/user/comments/add",
    canAccessNote,
    (req, res) => {
        AddComment(req, res);
    }
);


Crouter.post(
    "/user/comments/get",
    canAccessNote,
    (req, res) => {
        GetComments(req, res);
    }
);


Crouter.delete(
    "/user/comments/delete",
    (req, res) => {
        DeleteComment(req, res);
    }
);


export default Crouter;