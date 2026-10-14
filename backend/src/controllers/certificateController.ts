import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

export async function generateCertificate(req: AuthenticatedRequest, res: Response) {
    try {
        const { studentId, courseId, organizationName, authorizedSignature } = req.body;

        if (!studentId || !courseId || !organizationName) {
            return res.status(400).json({ success: false, error: "Student ID, course ID, and organization name are required." });
        }

        // Verify student exists and belongs to an organization
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { organization: true },
        });

        if (!student) {
            return res.status(404).json({ success: false, error: "Student not found." });
        }

        // Verify course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            return res.status(404).json({ success: false, error: "Course not found." });
        }

        // Generate unique certificate code
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const certificateId = `CERT-${Date.now()}-${randomCode}`;
        const qrCodeUrl = `https://tcms.local/verify/${certificateId}`;

        const certificate = await prisma.certificate.create({
            data: {
                certificateId,
                studentId,
                courseName: course.name,
                courseDuration: course.duration || "N/A",
                organizationName,
                authorizedSignature: authorizedSignature || "Authorized Registrar",
                qrCodeUrl,
                completionDate: new Date(),
            },
            include: {
                student: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Certificate generated successfully",
            certificate,
        });
    } catch (error) {
        console.error("Generate certificate error:", error);
        return res.status(500).json({ success: false, error: "Internal server error during certificate generation" });
    }
}

export async function getCertificates(req: AuthenticatedRequest, res: Response) {
    try {
        const { studentId } = req.query;
        const filters: any = {};
        if (studentId) filters.studentId = String(studentId);

        const certificates = await prisma.certificate.findMany({
            where: filters,
            include: { student: true },
            orderBy: { createdAt: "desc" },
        });

        return res.json({ success: true, count: certificates.length, certificates });
    } catch (error) {
        console.error("Fetch certificates error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

export async function verifyCertificate(req: any, res: Response) {
    try {
        const { certificateId } = req.params;

        const certificate = await prisma.certificate.findUnique({
            where: { certificateId },
            include: { student: true },
        });

        if (!certificate) {
            return res.status(404).json({ success: false, valid: false, error: "Certificate not found or invalid." });
        }

        return res.json({
            success: true,
            valid: true,
            message: "Certificate is authentic and valid",
            certificate,
        });
    } catch (error) {
        console.error("Verify certificate error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}