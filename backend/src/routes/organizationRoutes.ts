import { Router } from "express";
import { getOrganization, updateOrganization } from "../controllers/organizationController.js";
import { verifyToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", verifyToken, getOrganization);
router.put("/", verifyToken, requireRole(["SUPER_ADMIN"]), updateOrganization);

export default router;