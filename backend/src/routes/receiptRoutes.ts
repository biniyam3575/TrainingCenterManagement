import { Router } from "express";
import { generateReceipt, getReceipts } from "../controllers/receiptController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT", "RECEPTIONIST"]), generateReceipt);
router.get("/", verifyToken, getReceipts);

export default router;