import { Router } from "express";
import { recordAttendance, getAttendance } from "../controllers/attendanceController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER", "INSTRUCTOR"]), recordAttendance);
router.get("/", verifyToken, getAttendance);

export default router;