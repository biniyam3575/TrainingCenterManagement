import { Router } from "express";
import { getUserNotifications, createNotification, markAsRead } from "../controllers/notificationController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", verifyToken, getUserNotifications);
router.post("/", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER"]), createNotification);
router.patch("/:id/read", verifyToken, markAsRead);

export default router;