import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

// Get financial summary and payment plan for an enrollment
export async function getEnrollmentFeeDetails(req: AuthenticatedRequest, res: Response) {
    try {
        const { enrollmentId } = req.params;

        const enrollment = await prisma.enrollment.findUnique({
            where: { id: String(enrollmentId) },
            include: {
                student: true,
                course: true,
                batch: true,
                payments: true,
            },
        });

        if (!enrollment) {
            return res.status(404).json({ success: false, error: "Enrollment not found." });
        }

        const totalFee = Number(enrollment.courseFee);

        // Calculate total paid from associated payments
        const totalPaid = enrollment.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const outstandingBalance = totalFee - totalPaid;

        return res.json({
            success: true,
            financials: {
                enrollmentId: enrollment.id,
                student: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
                course: enrollment.course.name,
                totalFee,
                totalPaid,
                outstandingBalance,
                paymentPlan: enrollment.paymentPlan || null,
                status: enrollment.status,
            },
        });
    } catch (error) {
        console.error("Get fee details error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// Assign or update a structured payment plan (Installments) for an enrollment
export async function updatePaymentPlan(req: AuthenticatedRequest, res: Response) {
    try {
        const { enrollmentId } = req.params;
        const { planType, installments } = req.body;
        // planType: "FULL" | "INSTALLMENT"
        // installments: [{ installmentNumber: 1, amount: 2000, dueDate: "2026-11-30" }, ...]

        if (!enrollmentId || !planType) {
            return res.status(400).json({ success: false, error: "Enrollment ID and plan type are required." });
        }

        const paymentPlanData = {
            planType,
            installments: installments || [],
            updatedAt: new Date().toISOString(),
        };

        const updatedEnrollment = await prisma.enrollment.update({
            where: { id: String(enrollmentId) },
            data: {
                paymentPlan: paymentPlanData,
            },
        });

        return res.json({
            success: true,
            message: "Payment plan configured successfully",
            paymentPlan: updatedEnrollment.paymentPlan,
        });
    } catch (error) {
        console.error("Update payment plan error:", error);
        return res.status(500).json({ success: false, error: "Internal server error during payment plan configuration" });
    }
}