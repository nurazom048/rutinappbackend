import prisma from "../../../prisma/schema/prisma.clint";
import { Request, Response, NextFunction } from 'express';
//@ summaryAddPermission
export const summaryAddPermission = async (req: any, res: Response, next: NextFunction) => {
    const { classID } = req.params;
    const userID = req.user?.id;

    try {
        // Step 1: Validate classId presence
        if (!classID) {
            return res.status(400).json({ message: "Validation failed: 'classID' is required." });
        }

        // Step 2: Find the class and associated routine in a single query
        const findClass = await prisma.class.findUnique({
            where: { id: classID },
            include: { routine: true },
        });

        if (!findClass || !findClass.routine) {
            return res.status(404).json({ message: "Class or associated routine not found." });
        }

        const routineId = findClass.routine.id;

        // Step 3: Check user's membership and role (owner or captain)
        const routineMember = await prisma.routineMember.findFirst({
            where: {
                routineId: routineId,
                accountId: userID,
            },
        });

        if (!routineMember || (!routineMember.owner && !routineMember.captain)) {
            return res.status(403).json({ message: "Only captains and owners can add summaries." });
        }

        // Allow the request to proceed
        next();
    } catch (error: any) {
        console.error("Error in summaryPermission middleware:", error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};
//@ summaryModificationPermission
export const summaryModificationPermission = async (req: any, res: Response, next: NextFunction) => {
    const { summaryID } = req.params;
    const userID = req.user?.id;

    try {
        if (!summaryID) {
            return res.status(400).json({ message: "Validation failed: 'summaryID' is required." });
        }

        // Find the summary and its associated routine
        const findSummary = await prisma.summary.findUnique({
            where: { id: summaryID },
            include: { routine: true },
        });

        if (!findSummary) {
            return res.status(404).json({ message: "Summary not found." });
        }

        // Check if user is a routine member with permission
        const routineMember = await prisma.routineMember.findFirst({
            where: {
                routineId: findSummary.routineId,
                accountId: userID,
            },
        });

        if (!routineMember || (!routineMember.captain && findSummary.routine.ownerAccountId !== userID)) {
            return res.status(403).json({ message: "Only captains and owners can modify or remove summaries." });
        }

        // Attach the summary to the request for use in subsequent functions
        req.findSummary = findSummary;

        next();
    } catch (error: any) {
        console.error("Error in summary modification permission middleware:", error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};
