import express from "express";
import cors from "cors";
import { prisma } from "./config/prisma.js";
import { authRoutes } from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Database connection test route
app.get("/api/db-test", async (req, res) => {
    try {
        const orgCount = await prisma.organization.count();
        res.json({
            success: true,
            message: "Database connection active and verified with Prisma!",
            orgCount
        });
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ success: false, error: "Database connection failed" });
    }
});

// Mount Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});