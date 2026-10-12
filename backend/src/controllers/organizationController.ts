import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { prisma } from "../config/prisma.js";

// Get organization settings (auto-creates a default record if none exists)
export async function getOrganization(req: AuthenticatedRequest, res: Response) {
    try {
        const orgId = req.user?.organizationId;
        let organization = null;

        if (orgId) {
            organization = await prisma.organization.findUnique({
                where: { id: orgId },
            });
        }

        // If not found by user's org ID, grab the first available organization
        if (!organization) {
            organization = await prisma.organization.findFirst();
        }

        // If the table is completely empty, auto-create a default organization
        if (!organization) {
            organization = await prisma.organization.create({
                data: {
                    name: "Default Training Center",
                    currency: "ETB",
                    defaultLanguage: "en",
                },
            });
        }

        return res.json({ success: true, organization });
    } catch (error) {
        console.error("Fetch organization error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

// Update organization settings (Restricted to SUPER_ADMIN)
export async function updateOrganization(req: AuthenticatedRequest, res: Response) {
    try {
        const { name, phone, email, address, website, currency, defaultLanguage } = req.body;

        // Find the first organization or user's organization to update
        let organization = await prisma.organization.findFirst();

        if (!organization) {
            organization = await prisma.organization.create({
                data: {
                    name: name || "Default Training Center",
                    currency: currency || "ETB",
                },
            });
        }

        const updatedOrg = await prisma.organization.update({
            where: { id: organization.id },
            data: {
                name,
                phone,
                email,
                address,
                website,
                currency: currency || "ETB",
                defaultLanguage: defaultLanguage || "en",
            },
        });

        return res.json({
            success: true,
            message: "Organization settings updated successfully",
            organization: updatedOrg,
        });
    } catch (error) {
        console.error("Update organization error:", error);
        return res.status(500).json({ success: false, error: "Internal server error during update" });
    }
}