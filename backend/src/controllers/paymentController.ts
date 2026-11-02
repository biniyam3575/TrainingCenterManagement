import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

export async function recordPayment(req: AuthenticatedRequest, res: Response) {
    try {
        const { studentId, enrollmentId, amount, paymentMethod, referenceNo, notes, paymentDate } = req.body;

        if (!studentId || !enrollmentId || !amount) {
            return res.status(400).json({ success: false, error: "Student ID, enrollment ID, and amount are required." });
        }

        // Generate a unique reference ID for the payment transaction
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const paymentIdCode = `PAY-${Date.now()}-${randomCode}`;

        const payment = await prisma.payment.create({
            data: {
                paymentId: paymentIdCode,
                studentId,
                enrollmentId,
                amount: Number(amount),
                paymentMethod: paymentMethod || "CASH",
                referenceNo: referenceNo || null,
                recordedBy: req.user?.userId || "SYSTEM",
                notes: notes || null,
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            },
            include: {
                student: true,
                enrollment: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Payment recorded successfully",
            payment,
        });
    } catch (error) {
        console.error("Record payment error:", error);
        return res.status(500).json({ success: false, error: "Internal server error during payment recording" });
    }
}

export async function getPayments(req: AuthenticatedRequest, res: Response) {
    try {
        const { studentId, enrollmentId, search, paymentMethod } = req.query;

        const filters: any = {};

        // Existing ID filters
        if (studentId) filters.studentId = String(studentId);
        if (enrollmentId) filters.enrollmentId = String(enrollmentId);

        // Phase 26: Payment method filter[cite: 30]
        if (paymentMethod) {
            filters.paymentMethod = String(paymentMethod);
        }

        // Phase 26: Search filter for paymentId or referenceNo[cite: 30]
        if (search) {
            filters.OR = [
                { paymentId: { contains: String(search), mode: "insensitive" } },
                { referenceNo: { contains: String(search), mode: "insensitive" } },
            ];
        }

        const payments = await prisma.payment.findMany({
            where: filters,
            include: {
                student: true,
                enrollment: {
                    include: { course: true },
                },
            },
            orderBy: { paymentDate: "desc" },
        });

        return res.json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error("Fetch payments error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}