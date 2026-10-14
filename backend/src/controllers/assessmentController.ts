import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

// ==================== ASSESSMENTS ====================

export async function createAssessment(req: AuthenticatedRequest, res: Response) {
    try {
        const { courseId, batchId, name, type, date, maxScore, passingScore, weight } = req.body;

        if (!courseId || !batchId || !name || !date) {
            return res.status(400).json({ success: false, error: "Course ID, Batch ID, name, and date are required." });
        }

        const assessment = await prisma.assessment.create({
            data: {
                courseId,
                batchId,
                name,
                type: type || "ASSIGNMENT",
                date: new Date(date),
                maxScore: maxScore ? Number(maxScore) : 100.0,
                passingScore: passingScore ? Number(passingScore) : 50.0,
                weight: weight ? Number(weight) : 1.0,
            },
            include: { course: true, batch: true },
        });

        return res.status(201).json({
            success: true,
            message: "Assessment created successfully",
            assessment,
        });
    } catch (error) {
        console.error("Create assessment error:", error);
        return res.status(500).json({ success: false, error: "Internal server error during assessment creation" });
    }
}

export async function getAssessments(req: AuthenticatedRequest, res: Response) {
    try {
        const { batchId, courseId } = req.query;
        const filters: any = {};
        if (batchId) filters.batchId = String(batchId);
        if (courseId) filters.courseId = String(courseId);

        const assessments = await prisma.assessment.findMany({
            where: filters,
            include: { course: true, batch: true, grades: true },
            orderBy: { date: "desc" },
        });

        return res.json({ success: true, count: assessments.length, assessments });
    } catch (error) {
        console.error("Fetch assessments error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ==================== GRADES ====================

export async function recordGrades(req: AuthenticatedRequest, res: Response) {
    try {
        const { assessmentId, grades } = req.body;
        // grades expected format: [{ studentId: "uuid", score: 85.5, remarks: "Great job" }, ...]

        if (!assessmentId || !Array.isArray(grades)) {
            return res.status(400).json({ success: false, error: "Assessment ID and grades array are required." });
        }

        const gradeResults = await prisma.$transaction(
            grades.map((g: { studentId: string; score: number; remarks?: string }) => {
                return prisma.grade.upsert({
                    where: {
                        assessmentId_studentId: {
                            assessmentId,
                            studentId: g.studentId,
                        },
                    },
                    update: {
                        score: Number(g.score),
                        remarks: g.remarks || null,
                    },
                    create: {
                        assessmentId,
                        studentId: g.studentId,
                        score: Number(g.score),
                        remarks: g.remarks || null,
                    },
                });
            })
        );

        return res.status(201).json({
            success: true,
            message: "Grades recorded successfully",
            count: gradeResults.length,
            grades: gradeResults,
        });
    } catch (error) {
        console.error("Record grades error:", error);
        return res.status(500).json({ success: false, error: "Internal server error during grade recording" });
    }
}

export async function getGrades(req: AuthenticatedRequest, res: Response) {
    try {
        const { assessmentId, studentId } = req.query;
        const filters: any = {};
        if (assessmentId) filters.assessmentId = String(assessmentId);
        if (studentId) filters.studentId = String(studentId);

        const grades = await prisma.grade.findMany({
            where: filters,
            include: { assessment: true },
            orderBy: { createdAt: "desc" },
        });

        return res.json({ success: true, count: grades.length, grades });
    } catch (error) {
        console.error("Fetch grades error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}