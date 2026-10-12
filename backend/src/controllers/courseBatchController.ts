import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

// ==================== COURSE CATEGORIES ====================

export async function createCategory(req: AuthenticatedRequest, res: Response) {
    try {
        const { name, description } = req.body;

        const category = await prisma.courseCategory.create({
            data: { name, description },
        });

        return res.status(201).json({ success: true, message: "Course category created", category });
    } catch (error) {
        console.error("Create category error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

export async function getCategories(req: AuthenticatedRequest, res: Response) {
    try {
        const categories = await prisma.courseCategory.findMany({
            include: { courses: true },
        });
        return res.json({ success: true, categories });
    } catch (error) {
        console.error("Fetch categories error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ==================== COURSES ====================

export async function createCourse(req: AuthenticatedRequest, res: Response) {
    try {
        const {
            courseCode,
            name,
            description,
            categoryId,
            duration,
            numberOfSessions,
            courseFee,
            prerequisites
        } = req.body;

        const rawOrgId = req.user?.organizationId;
        const orgId = Array.isArray(rawOrgId) ? rawOrgId[0] : rawOrgId;
        let organizationId: string;

        if (!orgId) {
            const defaultOrg = await prisma.organization.findFirst();
            if (!defaultOrg) {
                return res.status(400).json({ success: false, error: "No organization found." });
            }
            organizationId = defaultOrg.id;
        } else {
            organizationId = orgId;
        }

        const existingCourse = await prisma.course.findUnique({
            where: { courseCode },
        });

        if (existingCourse) {
            return res.status(400).json({ success: false, error: "Course code already exists." });
        }

        const course = await prisma.course.create({
            data: {
                courseCode,
                name,
                description,
                categoryId,
                duration,
                numberOfSessions: Number(numberOfSessions) || 1,
                courseFee: Number(courseFee) || 0.00,
                prerequisites,
                organizationId,
            },
        });

        return res.status(201).json({ success: true, message: "Course created successfully", course });
    } catch (error) {
        console.error("Create course error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

export async function getCourses(req: AuthenticatedRequest, res: Response) {
    try {
        const courses = await prisma.course.findMany({
            include: { category: true, batches: true },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ success: true, count: courses.length, courses });
    } catch (error) {
        console.error("Fetch courses error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// ==================== BATCHES ====================

export async function createBatch(req: AuthenticatedRequest, res: Response) {
    try {
        const { batchId, courseId, instructorId, classroomId, startDate, endDate, capacity } = req.body;

        const existingBatch = await prisma.batch.findUnique({
            where: { batchId },
        });

        if (existingBatch) {
            return res.status(400).json({ success: false, error: "Batch ID already exists." });
        }

        const batch = await prisma.batch.create({
            data: {
                batchId,
                courseId,
                instructorId: instructorId || null,
                classroomId: classroomId || null,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                capacity: Number(capacity) || 30,
            },
        });

        return res.status(201).json({ success: true, message: "Batch created successfully", batch });
    } catch (error) {
        console.error("Create batch error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

export async function getBatches(req: AuthenticatedRequest, res: Response) {
    try {
        const batches = await prisma.batch.findMany({
            include: { course: true, instructor: true, classroom: true },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ success: true, count: batches.length, batches });
    } catch (error) {
        console.error("Fetch batches error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}