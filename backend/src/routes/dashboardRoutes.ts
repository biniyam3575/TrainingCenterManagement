import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboardController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/metrics", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]), getDashboardMetrics);

export default router;