import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

import {
    Userprofile,
    UpdateProfile,
    Dashboard,
    FindUserByEmail
} from "../controllers/userController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/user/profile", Userprofile);
router.post("/user/profile/update", UpdateProfile);
router.get("/user/dashboard", Dashboard);
router.get("/user/find-by-email", FindUserByEmail);

export default router;
