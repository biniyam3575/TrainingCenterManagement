import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

// Record or update attendance for a batch session
export async function recordAttendance(req: AuthenticatedRequest, res: Response) {
    try {
        const { batchId, date, records } = req.body;
        // records expected format: [{ studentId: "uuid", status: "PRESENT" }, ...]

        if (!batchId || !date || !Array.isArray(records)) {
            return res.status(400).json({ success: false, error: "Batch ID, date, and attendance records array are required." });
        }

        const sessionDate = new Date(date);
        const staffName = req.user?.email || "Instructor";

        // Use a transaction to process all student attendance records atomically
        const attendanceResults = await prisma.$transaction(
            records.map((record: { studentId: string; status: string; remarks?: string }) => {
                return prisma.attendance.upsert({
                    where: {
                        // Prisma compound key constraint (if defined) or match unique identifiers
                        // Note: If you don't have a @@unique([studentId, batchId, date]) in your schema, 
                        // you might want to add it, or look up by ID. For now, let's use standard upsert lookup:
                        studentId_batchId_date: {
                            studentId: record.studentId,
                            batchId,
                            date: sessionDate,
                        } as any,
                    },
                    update: {
                        status: record.status as any || "PRESENT",

                    },
                    create: {
                        studentId: record.studentId,
                        batchId,
                        date: sessionDate,
                        status: record.status as any || "PRESENT",
                    },
                });
            })
        );

        return res.status(201).json({
            success: true,
            message: "Attendance recorded successfully",
            count: attendanceResults.length,
            attendance: attendanceResults,
        });
    } catch (error) {
        console.error("Record attendance error:", error);
        return res.status(500).json({ success: false, error: "Internal server error during attendance recording" });
    }
}

// Get attendance records for a batch or student
export async function getAttendance(req: AuthenticatedRequest, res: Response) {
    try {
        const { batchId, studentId } = req.query;

        const filters: any = {};
        if (batchId) filters.batchId = String(batchId);
        if (studentId) filters.studentId = String(studentId);

        const attendanceRecords = await prisma.attendance.findMany({
            where: filters,
            include: {
                student: true,
                batch: { include: { course: true } }
            },
            orderBy: { date: "desc" },
        });

        return res.json({
            success: true,
            count: attendanceRecords.length,
            attendance: attendanceRecords,
        });
    } catch (error) {
        console.error("Fetch attendance error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}