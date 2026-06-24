import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { canAccessNote } from "../middleware/accessMiddleware.js";
import upload from "../config/multer.js";

import {
    uploadfile,
    GetNotesone,
    GetNotesAll,
    DeleteOne,
    GetReceivedNotes,
    SearchNotes
} from "../controllers/noteController.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
    "/user/upload",
    upload.single("note"),
    uploadfile
);

router.get("/user/notes/getnotesall", GetNotesAll);

router.get("/user/notes/received", GetReceivedNotes);

router.get("/user/notes/search", SearchNotes);

router.get(
    "/user/notes/:id",
    canAccessNote,
    GetNotesone
);


router.delete(
    "/user/notes/:id",
    DeleteOne
);

export default router;
