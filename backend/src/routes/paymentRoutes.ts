import { Router } from "express";
import { recordPayment, getPayments } from "../controllers/paymentController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]), recordPayment);
router.get("/", verifyToken, getPayments);

export default router;