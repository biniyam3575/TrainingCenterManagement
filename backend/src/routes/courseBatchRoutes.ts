import { Router } from "express";
import {
    createCategory,
    getCategories,
    createCourse,
    getCourses,
    createBatch,
    getBatches
} from "../controllers/courseBatchController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Categories
router.post("/categories", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER"]), createCategory);
router.get("/categories", verifyToken, getCategories);

// Courses
router.post("/", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER"]), createCourse);
router.get("/", verifyToken, getCourses);

// Batches
router.post("/batches", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER"]), createBatch);
router.get("/batches", verifyToken, getBatches);

export default router;