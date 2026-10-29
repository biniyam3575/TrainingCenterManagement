import { Router } from "express";
import { generateReport } from "../controllers/reportController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/:type", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]), generateReport);

export default router;