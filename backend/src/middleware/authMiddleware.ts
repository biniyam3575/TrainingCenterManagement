import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "tcms_fallback_secret_key";

// Extend Express Request interface to include authenticated user payload
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        organizationId?: string;
    };
}

// Middleware to verify JWT token
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest["user"];
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, error: "Invalid or expired token." });
    }
};

// Middleware factory to restrict access to specific roles
export const requireRole = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: "Unauthorized access." });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access forbidden. Requires one of the following roles: ${allowedRoles.join(", ")}`
            });
        }

        next();
    };
};