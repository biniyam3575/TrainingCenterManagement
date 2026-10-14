import { Router } from "express";
import { getEnrollmentFeeDetails, updatePaymentPlan } from "../controllers/feeController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/enrollments/:enrollmentId", verifyToken, getEnrollmentFeeDetails);
router.put("/enrollments/:enrollmentId/plan", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]), updatePaymentPlan);

export default router;