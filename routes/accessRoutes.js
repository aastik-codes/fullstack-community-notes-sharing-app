import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

import {
    AddAccess,
    RemoveAccess,
    ChangeVisibility
} from "../controllers/accessController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/user/notes/access/add", AddAccess);
router.post("/user/notes/access/remove", RemoveAccess);
router.post("/user/notes/visibility", ChangeVisibility);

export default router;
