import { Router } from "express";
import {
    createAssessment,
    getAssessments,
    recordGrades,
    getGrades
} from "../controllers/assessmentController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Assessments
router.post("/", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER", "INSTRUCTOR"]), createAssessment);
router.get("/", verifyToken, getAssessments);

// Grades
router.post("/grades", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER", "INSTRUCTOR"]), recordGrades);
router.get("/grades", verifyToken, getGrades);

export default router;