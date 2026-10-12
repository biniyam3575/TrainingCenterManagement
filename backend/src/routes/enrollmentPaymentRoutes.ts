import { Router } from "express";
import {
    enrollStudent,
    getEnrollments,
    recordPayment,
    getPayments
} from "../controllers/enrollmentPaymentController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Enrollments
router.post("/", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER", "RECEPTIONIST"]), enrollStudent);
router.get("/", verifyToken, getEnrollments);

// Payments & Receipts
router.post("/payments", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]), recordPayment);
router.get("/payments", verifyToken, getPayments);

export default router;