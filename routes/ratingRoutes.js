import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js"
import { canAccessNote } from "../middleware/accessMiddleware.js";
import { RateNote } from "../controllers/ratingController.js";

const Rrouter = express.Router();

Rrouter.use(authMiddleware);

Rrouter.post(
    "/user/notes/rate",canAccessNote,(req, res) => {
        RateNote(req, res);
    }
);

export default Rrouter;