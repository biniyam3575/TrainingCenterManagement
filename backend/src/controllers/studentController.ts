import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

// Register a new student
export async function registerStudent(req: AuthenticatedRequest, res: Response) {
    try {
        const {
            studentId,
            firstName,
            middleName,
            lastName,
            gender,
            dateOfBirth,
            phone,
            email,
            address,
            emergencyContact,
            notes
        } = req.body;

        // Safely handle organizationId type whether it comes as string or array
        const rawOrgId = req.user?.organizationId;
        const orgId = Array.isArray(rawOrgId) ? rawOrgId[0] : rawOrgId;

        let organizationId: string;

        if (!orgId) {
            const defaultOrg = await prisma.organization.findFirst();
            if (!defaultOrg) {
                return res.status(400).json({ success: false, error: "No organization found to attach student to." });
            }
            organizationId = defaultOrg.id;
        } else {
            organizationId = orgId;
        }

        // Check if student ID already exists
        const existingStudent = await prisma.student.findUnique({
            where: { studentId },
        });

        if (existingStudent) {
            return res.status(400).json({ success: false, error: "A student with this Student ID already exists." });
        }

        const newStudent = await prisma.student.create({
            data: {
                studentId,
                firstName,
                middleName,
                lastName,
                gender,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                phone,
                email,
                address,
                emergencyContact,
                notes,
                organizationId,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Student registered successfully",
            student: newStudent,
        });
    } catch (error) {
        console.error("Student registration error:", error);
        return res.status(500).json({ success: false, error: "Internal server error during student registration" });
    }
}

// Get all students for the organization
export async function getStudents(req: AuthenticatedRequest, res: Response) {
    try {
        const students = await prisma.student.findMany({
            include: {
                enrollments: {
                    include: { course: true }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        return res.json({
            success: true,
            count: students.length,
            students,
        });
    } catch (error) {
        console.error("Fetch students error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// Get a single student profile by ID
export async function getStudentById(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;

        if (!id || typeof id !== "string") {
            return res.status(400).json({ success: false, error: "Valid Student ID parameter is required." });
        }

        const student = await prisma.student.findUnique({
            where: { id: String(id) },
            include: {
                enrollments: {
                    include: { course: true, batch: true }
                },
                payments: true,
                certificates: true,
            },
        });

        if (!student) {
            return res.status(404).json({ success: false, error: "Student not found." });
        }

        return res.json({ success: true, student });
    } catch (error) {
        console.error("Fetch student profile error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// Update student status or details
export async function updateStudent(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;

        if (!id || typeof id !== "string") {
            return res.status(400).json({ success: false, error: "Valid Student ID parameter is required." });
        }

        const { firstName, lastName, phone, email, status, emergencyContact, notes } = req.body;

        const updatedStudent = await prisma.student.update({
            where: {
                id: String(id)
            },
            data: {
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
                ...(status !== undefined && { status }),
                ...(emergencyContact !== undefined && { emergencyContact }),
                ...(notes !== undefined && { notes }),
            },
        });

        return res.json({
            success: true,
            message: "Student updated successfully",
            student: updatedStudent,
        });
    } catch (error) {
        console.error("Update student error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}