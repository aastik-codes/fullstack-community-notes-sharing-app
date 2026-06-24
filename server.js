import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import HealthRoutes from "./routes/routes.js";
import authRoutes from "./routes/authRoutes.js";
import Userroutes from "./routes/userRoutes.js";
import Nrouter from "./routes/noteRoutes.js";
import Arouter from "./routes/accessRoutes.js";
import Rrouter from "./routes/ratingRoutes.js";
import Crouter from "./routes/commentRoutes.js";

import { connectDB } from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

/*
    ES modules do not directly provide __dirname,
    so we create it manually.
*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
    Read JSON and form data sent from frontend.
*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
    Serve every file inside the public folder.

    Examples:

    public/login.html
    becomes:
    http://localhost:3000/login.html

    public/dashboard.html
    becomes:
    http://localhost:3000/dashboard.html
*/
app.use(express.static(path.join(__dirname, "public")));

/*
    Open the login page when the user visits:
    http://localhost:3000
*/
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "login.html")
    );
});

/*
    Backend API routes
*/
app.use("/", authRoutes);
app.use("/", Userroutes);
app.use("/", Nrouter);
app.use("/", Arouter);
app.use("/", Rrouter);
app.use("/", Crouter);

/*
    Keep health check on a separate URL
    because "/" now opens login.html.
*/
app.use("/api/health", HealthRoutes);

/*
    Handle unknown URLs.
*/
app.use((req, res) => {
    res.status(404).json({
        message: "Page or API route not found"
    });
});

/*
    Connect database first, then start server.
*/
async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Frontend: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server failed to start:", error);
        process.exit(1);
    }
}

startServer();