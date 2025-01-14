import { Request, Response, NextFunction } from 'express';
import prisma from '../../../prisma/schema/prisma.clint';
import { Day } from '../../../utils/enum';


export const classValidation = (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);

    try {
        const { name, instructorName, subjectCode, room, weekday, startTime, endTime } = req.body; // Added `startTime` and `endTime`
        const { routineId } = req.params;

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
        if (!weekday || typeof weekday !== "string" || !Object.keys(Day).some((key) => key.toUpperCase() === weekday.toUpperCase())) {
            return res.status(400).json({
                message: `Validation failed: 'weekday' must be one of the following: ${Object.keys(Day).join(", ")}`,
            });
        }
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
    } catch (error) {
        // Handle unexpected errors during validation
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


//@cakedPermission
export const cakedPermission = async (req: any, res: Response, next: NextFunction) => {
    const { routineId } = req.params;
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

        // Parse the start and end times
        const startTimeMills: number = new Date(startTime).getTime();
        const endTimeMills: number = new Date(endTime).getTime();

        // Validation for classID, room, and day
        if (!classID) {
            return res.status(400).send({ message: 'Validation failed: classId is required' });
        }

        if (!room) {
            return res.status(400).send({ message: 'Validation failed: room is required' });
        }

        if (!day || typeof day !== 'string' || !Object.values(Day).includes(day.toLowerCase() as Day)) {
            return res.status(400).json({
                message: `Validation failed: 'day' must be one of the following: ${Object.values(Day).join(", ")}`,
            });
        }

        // Validation for start and end time
        if (!startTimeMills) {
            return res.status(400).send({ message: 'Validation failed: Start time is required' });
        }

        if (!endTimeMills) {
            return res.status(400).send({ message: 'Validation failed: End time is required' });
        }

        if (endTimeMills <= startTimeMills) {
            return res.status(400).send({ message: 'Validation failed: End time should be greater than start time' });
        }

        // If all validations pass, proceed to the next middleware/controller
        next();
    } catch (error) {
        // Handle any errors that occur during validation
        res.status(500).send({ message: 'Internal server error' });
    }
};
