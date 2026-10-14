import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

export async function generateReceipt(req: AuthenticatedRequest, res: Response) {
    try {
        const { paymentId } = req.body;

        if (!paymentId) {
            return res.status(400).json({ success: false, error: "Payment ID is required." });
        }

        // Fetch payment along with student and enrollment details
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                student: {
                    include: { organization: true },
                },
                enrollment: {
                    include: { course: true, payments: true },
                },
            },
        });

        if (!payment) {
            return res.status(404).json({ success: false, error: "Payment not found." });
        }

        // Check if a receipt already exists for this payment
        const existingReceipt = await prisma.receipt.findFirst({
            where: { paymentId: payment.id },
        });

        if (existingReceipt) {
            return res.json({
                success: true,
                message: "Receipt already exists for this payment",
                receipt: existingReceipt,
            });
        }

        const totalFee = Number(payment.enrollment.courseFee);

        // Calculate total paid prior to or including this payment
        const allPayments = payment.enrollment.payments;
        const totalPaidBefore = allPayments
            .filter((p) => new Date(p.paymentDate) <= new Date(payment.paymentDate) && p.id !== payment.id)
            .reduce((sum, p) => sum + Number(p.amount), 0);

        const previousBalance = totalFee - totalPaidBefore;
        const remainingBalance = previousBalance - Number(payment.amount);

        // Generate unique receipt number
        const receiptNumber = `REC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

        const receipt = await prisma.receipt.create({
            data: {
                receiptNumber,
                paymentId: payment.id,
                studentId: payment.studentId,
                enrollmentId: payment.enrollmentId,
                amountPaid: payment.amount,
                previousBalance,
                remainingBalance: remainingBalance < 0 ? 0 : remainingBalance,
                paymentMethod: payment.paymentMethod,
                authorizedStaff: req.user?.userId || "SYSTEM",
            },
            include: {
                student: true,
                enrollment: { include: { course: true } },
                payment: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Receipt generated successfully",
            receipt,
        });
    } catch (error) {
        console.error("Generate receipt error:", error);
        return res.status(500).json({ success: false, error: "Internal server error during receipt generation" });
    }
}

export async function getReceipts(req: AuthenticatedRequest, res: Response) {
    try {
        const { studentId, enrollmentId } = req.query;
        const filters: any = {};
        if (studentId) filters.studentId = String(studentId);
        if (enrollmentId) filters.enrollmentId = String(enrollmentId);

        const receipts = await prisma.receipt.findMany({
            where: filters,
            include: {
                student: true,
                enrollment: { include: { course: true } },
                payment: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return res.json({ success: true, count: receipts.length, receipts });
    } catch (error) {
        console.error("Fetch receipts error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}