import { Request, Response, NextFunction } from 'express';
import prisma from '../../../prisma/schema/prisma.clint';
import { Day } from '../../../prisma/client';


const VALID_DAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

export const normalizeDay = (d: any): 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' => {
    const s = String(d || '').toLowerCase().trim();
    if (s.startsWith('sun')) return 'sun';
    if (s.startsWith('mon')) return 'mon';
    if (s.startsWith('tue')) return 'tue';
    if (s.startsWith('wed')) return 'wed';
    if (s.startsWith('thu')) return 'thu';
    if (s.startsWith('fri')) return 'fri';
    if (s.startsWith('sat')) return 'sat';
    return 'sun';
};

export const classValidation = (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);

    try {
        const { name, instructorName, subjectCode, room, weekday, startTime, endTime } = req.body;
        const routineId = req.params.routineId || req.params.routineID;

        // Validation for required fields
        if (!name) {
            return res.status(400).json({ message: "Validation failed: 'name' is required" });
        }
        if (!instructorName) {
            return res.status(400).json({ message: "Validation failed: 'instructorName' is required" });
        }
        if (!subjectCode) {
            return res.status(400).json({ message: "Validation failed: 'subjectCode' is required" });
        }
        const normalizedWeekday = normalizeDay(weekday);
        if (!weekday || typeof weekday !== "string" || !VALID_DAYS.includes(normalizedWeekday)) {
            return res.status(400).json({
                message: `Validation failed: 'weekday' must be one of: ${VALID_DAYS.join(", ")}`,
            });
        }
        req.body.weekday = normalizedWeekday;

        if (!room) {
            return res.status(400).json({ message: "Validation failed: 'room' is required" });
        }
        if (!startTime) {
            return res.status(400).json({ message: "Validation failed: 'startTime' is required" });
        }
        if (!endTime) {
            return res.status(400).json({ message: "Validation failed: 'endTime' is required" });
        }
        if (!routineId) {
            return res.status(400).json({ message: "Validation failed: 'routineId' is required" });
        }

        // Proceed to the next middleware/controller if all validations pass
        next();
    } catch (error: any) {
        console.error("❌ Error in classValidation:", error);
        res.status(500).json({ message: "Internal server error in validation", error: error.message });
    }
};


//@cakedPermission
export const cakedPermission = async (req: any, res: Response, next: NextFunction) => {
    const routineId = req.params.routineId || req.params.routineID;

    const userID = req.user?.id;

    if (!routineId) {
        return res.status(400).json({ message: "Validation failed: 'routineId' is required" });
    }

    if (!userID) {
        return res.status(400).json({ message: "Validation failed: 'userID' is required" });
    }

    try {
        // Find Routine to check ownership
        const findRoutine = await prisma.routine.findUnique({ where: { id: routineId } });
        if (!findRoutine) {
            return res.status(404).json({ message: "Routine not found" });
        }

        // Check permission: owner or captain
        const routineMember = await prisma.routineMember.findFirst({
            where: {
                routineId: routineId,
                accountId: userID,
            },
        });

        if (!routineMember || (!routineMember.owner && !routineMember.captain)) {
            return res.status(403).json({ message: "Only captains and owners can add classes" });
        }

        next();
    } catch (error: any) {
        console.error({ message: 'Error middleware adding classes', error });
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// class edit validation

export const classEditValidation = (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body)
    try {
        const { name, instructorName, subjectCode } = req.body;


        // Check if required fields are provided
        if (!name) {
            return res.status(400).send({ message: 'Validation failed: name is required' });
        }
        if (!instructorName) {
            return res.status(400).send({ message: 'Validation failed: instructorName is required' });
        }
        if (!subjectCode) {
            return res.status(400).send({ message: 'Validation failed: subjectcode is required' });
        }

        next();
    } catch (error) {

        res.status(500).send({ message: 'Internal server error' });
    }
};



//## Add Weekday Validation functions
export const weekdayValidation = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startTime, endTime, room, day } = req.body;
        const { classID } = req.params;

        if (!classID) {
            return res.status(400).json({ message: 'Validation failed: classId is required' });
        }

        if (!room) {
            return res.status(400).json({ message: 'Validation failed: room is required' });
        }

        const validDays = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
        const normalizedDay = normalizeDay(day);

        if (!day || !validDays.includes(normalizedDay)) {
            return res.status(400).json({
                message: `Validation failed: 'day' must be one of: ${validDays.join(", ")}`,
            });
        }
        req.body.day = normalizedDay;

        const startTimeMills: number = new Date(startTime).getTime();
        const endTimeMills: number = new Date(endTime).getTime();

        if (isNaN(startTimeMills)) {
            return res.status(400).json({ message: 'Validation failed: Start time is invalid' });
        }

        if (isNaN(endTimeMills)) {
            return res.status(400).json({ message: 'Validation failed: End time is invalid' });
        }

        if (endTimeMills <= startTimeMills) {
            return res.status(400).json({ message: 'Validation failed: End time should be greater than start time' });
        }

        next();
    } catch (error: any) {
        console.error('❌ Error in weekdayValidation:', error);
        return res.status(500).json({ message: error.message || 'Internal server error in validation' });
    }
};

