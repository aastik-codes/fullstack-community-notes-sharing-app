import express from "express";
import HealthRoutes from "./routes/routes.js";
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./config/db.js";
import Userroutes from "./routes/userRoutes.js";
import Nrouter from "./routes/noteRoutes.js";
import Arouter from "./routes/accessRoutes.js";
import Rrouter from "./routes/ratingRoutes.js";
import Crouter from "./routes/commentRoutes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", HealthRoutes);
app.use("/", authRoutes);
app.use("/", Userroutes);
app.use("/", Nrouter);
app.use("/", Arouter);
app.use("/", Rrouter);
app.use("/", Crouter);

app.listen(3000, () => {
    connectDB();
    console.log("server is running on port 3000");
});