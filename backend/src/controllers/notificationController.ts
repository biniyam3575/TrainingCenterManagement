import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

// Fetch notifications for the logged-in user
export async function getUserNotifications(req: AuthenticatedRequest, res: Response) {
    try {
        const rawUserId = req.user?.userId;

        if (!rawUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized user context." });
        }

        const userId = String(rawUserId);

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        return res.json({ success: true, count: notifications.length, notifications });
    } catch (error) {
        console.error("Fetch notifications error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// Create a new system notification (Admin/Manager use)
export async function createNotification(req: AuthenticatedRequest, res: Response) {
    try {
        const { userId, message, type } = req.body;

        if (!userId || !message) {
            return res.status(400).json({ success: false, error: "User ID and message are required." });
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                message,
                type: type || "GENERAL",
            },
        });

        return res.status(201).json({
            success: true,
            message: "Notification created successfully",
            notification,
        });
    } catch (error) {
        console.error("Create notification error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// Mark a notification as read
export async function markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
        const id = String(req.params.id);

        const notification = await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });

        return res.json({
            success: true,
            message: "Notification marked as read",
            notification,
        });
    } catch (error) {
        console.error("Mark notification read error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}