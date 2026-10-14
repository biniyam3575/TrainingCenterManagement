import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

export async function getDashboardMetrics(req: AuthenticatedRequest, res: Response) {
    try {
        const [
            totalStudents,
            activeStudents,
            completedStudents,
            graduatedStudents,
            droppedStudents,
            totalCourses,
            activeBatches,
            totalInstructors,
            totalPayments,
        ] = await Promise.all([
            prisma.student.count(),
            prisma.student.count({ where: { status: "ACTIVE" } }),
            prisma.student.count({ where: { status: "COMPLETED" } }),
            prisma.student.count({ where: { status: "GRADUATED" } }),
            prisma.student.count({ where: { status: "DROPPED" } }),
            prisma.course.count(),
            prisma.batch.count({ where: { status: "ACTIVE" } }),
            prisma.instructor.count(),
            prisma.payment.aggregate({ _sum: { amount: true } }),
        ]);

        return res.json({
            success: true,
            metrics: {
                students: {
                    total: totalStudents,
                    active: activeStudents,
                    completed: completedStudents,
                    graduated: graduatedStudents,
                    dropped: droppedStudents,
                },
                courses: totalCourses,
                batches: {
                    active: activeBatches,
                },
                instructors: totalInstructors,
                financials: {
                    totalRevenue: totalPayments._sum.amount || 0,
                },
            },
        });
    } catch (error) {
        console.error("Dashboard metrics error:", error);
        return res.status(500).json({ success: false, error: "Internal server error while fetching dashboard metrics" });
    }
}