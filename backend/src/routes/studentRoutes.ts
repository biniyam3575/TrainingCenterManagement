import { Router } from "express";
import {
    registerStudent,
    getStudents,
    getStudentById,
    updateStudent
} from "../controllers/studentController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Staff and Admins can manage students (SUPER_ADMIN, MANAGER, RECEPTIONIST)
router.post("/", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER", "RECEPTIONIST"]), registerStudent);
router.get("/", verifyToken, getStudents);
router.get("/:id", verifyToken, getStudentById);
router.put("/:id", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER", "RECEPTIONIST"]), updateStudent);

export default router;