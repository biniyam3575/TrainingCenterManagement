import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

export async function generateReport(req: AuthenticatedRequest, res: Response) {
    try {
        const { type } = req.params;
        let reportData: any = {};

        switch (type) {
            case "students":
                reportData = await prisma.student.findMany({
                    include: { organization: true, enrollments: { include: { course: true } } },
                    orderBy: { registrationDate: "desc" },
                });
                break;

            case "financials":
                reportData = await prisma.payment.findMany({
                    include: { student: true, enrollment: { include: { course: true } } },
                    orderBy: { paymentDate: "desc" },
                });
                break;

            case "attendance":
                reportData = await prisma.attendance.findMany({
                    include: { student: true, batch: { include: { course: true } } },
                    orderBy: { date: "desc" },
                });
                break;

            case "academics":
                reportData = await prisma.grade.findMany({
                    include: { assessment: { include: { course: true } }, student: true },
                    orderBy: { createdAt: "desc" },
                });
                break;

            case "certificates":
                reportData = await prisma.certificate.findMany({
                    include: { student: true },
                    orderBy: { createdAt: "desc" },
                });
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: "Invalid report type. Choose from: students, financials, attendance, academics, certificates.",
                });
        }

        return res.json({
            success: true,
            reportType: type,
            generatedAt: new Date(),
            count: Array.isArray(reportData) ? reportData.length : 1,
            data: reportData,
        });
    } catch (error) {
        console.error("Generate report error:", error);
        return res.status(500).json({ success: false, error: "Internal server error while generating report" });
    }
}