import { Router } from "express";
import { generateCertificate, getCertificates, verifyCertificate } from "../controllers/certificateController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Public verification route for QR codes
router.get("/verify/:certificateId", verifyCertificate);

// Protected administrative routes
router.post("/", verifyToken, requireRole(["SUPER_ADMIN", "MANAGER"]), generateCertificate);
router.get("/", verifyToken, getCertificates);

export default router;