import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

// ==================== ENROLLMENTS ====================

export async function enrollStudent(req: AuthenticatedRequest, res: Response) {
    try {
        const { studentId, courseId, batchId, courseFee, paymentPlan } = req.body;

        // Check if student exists
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (!student) {
            return res.status(404).json({ success: false, error: "Student not found." });
        }

        // Check if course exists
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            return res.status(404).json({ success: false, error: "Course not found." });
        }

        // Check if batch exists and has capacity
        const batch = await prisma.batch.findUnique({
            where: { id: batchId },
            include: { enrollments: true },
        });
        if (!batch) {
            return res.status(404).json({ success: false, error: "Batch not found." });
        }

        if (batch.enrollments.length >= batch.capacity) {
            return res.status(400).json({ success: false, error: "Batch has reached maximum capacity." });
        }

        // Check existing enrollment in this batch
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: { studentId_batchId: { studentId, batchId } },
        });

        if (existingEnrollment) {
            return res.status(400).json({ success: false, error: "Student is already enrolled in this batch." });
        }

        const feeToApply = courseFee !== undefined ? Number(courseFee) : Number(course.courseFee);

        const enrollment = await prisma.enrollment.create({
            data: {
                studentId,
                courseId,
                batchId,
                courseFee: feeToApply,
                paymentPlan: paymentPlan || null,
            },
            include: { student: true, course: true, batch: true },
        });

        return res.status(201).json({
            success: true,
            message: "Student enrolled successfully",
            enrollment,
        });
    } catch (error) {
        console.error("Enrollment error:", error);
        return res.status(500).json({ success: false, error: "Internal server error during enrollment" });
    }
}

export async function getEnrollments(req: AuthenticatedRequest, res: Response) {
    try {
        const enrollments = await prisma.enrollment.findMany({
            include: { student: true, course: true, batch: true, payments: true },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ success: true, count: enrollments.length, enrollments });
    } catch (error) {
        console.error("Fetch enrollments error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ==================== PAYMENTS & RECEIPTS ====================

export async function recordPayment(req: AuthenticatedRequest, res: Response) {
    try {
        const { studentId, enrollmentId, amount, paymentMethod, referenceNo, notes } = req.body;

        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ success: false, error: "Valid payment amount is required." });
        }

        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: { payments: true },
        });

        if (!enrollment) {
            return res.status(404).json({ success: false, error: "Enrollment record not found." });
        }

        // Calculate previous payments total
        const totalPaidBefore = enrollment.payments.reduce(
            (sum, p) => sum + Number(p.amount),
            0
        );

        const courseFee = Number(enrollment.courseFee);
        const previousBalance = courseFee - totalPaidBefore;
        const remainingBalance = Math.max(0, previousBalance - numericAmount);

        const paymentIdNum = `PAY-${Date.now()}`;
        const receiptNum = `REC-${Date.now()}`;
        const staffName = req.user?.email || "Admin Staff";

        // Perform transaction to save payment and generate receipt atomically
        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    paymentId: paymentIdNum,
                    studentId,
                    enrollmentId,
                    amount: numericAmount,
                    paymentMethod: paymentMethod || "CASH",
                    referenceNo: referenceNo || null,
                    recordedBy: staffName,
                    notes: notes || null,
                },
            });

            const receipt = await tx.receipt.create({
                data: {
                    receiptNumber: receiptNum,
                    paymentId: payment.id,
                    studentId,
                    enrollmentId,
                    amountPaid: numericAmount,
                    previousBalance,
                    remainingBalance,
                    paymentMethod: paymentMethod || "CASH",
                    authorizedStaff: staffName,
                },
            });

            return { payment, receipt };
        });

        return res.status(201).json({
            success: true,
            message: "Payment recorded and receipt generated successfully",
            payment: result.payment,
            receipt: result.receipt,
            financialSummary: {
                courseFee,
                totalPaid: totalPaidBefore + numericAmount,
                remainingBalance,
            },
        });
    } catch (error) {
        console.error("Record payment error:", error);
        return res.status(500).json({ success: false, error: "Internal server error during payment recording" });
    }
}

export async function getPayments(req: AuthenticatedRequest, res: Response) {
    try {
        const payments = await prisma.payment.findMany({
            include: { student: true, enrollment: { include: { course: true } }, receipts: true },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error("Fetch payments error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}