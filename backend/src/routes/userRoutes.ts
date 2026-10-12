import { Router } from "express";
import { verifyToken, requireRole, AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

const router = Router();

// Get all users (Restricted to SUPER_ADMIN and MANAGER)
router.get("/", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER"]), async (req: AuthenticatedRequest, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        return res.json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("Fetch users error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
});

export default router;