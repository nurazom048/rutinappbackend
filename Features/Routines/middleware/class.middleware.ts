import { Request, Response, NextFunction } from 'express';
import prisma from '../../../prisma/schema/prisma.clint';

export const checkClassAndPermission = async (req: any, res: Response, next: NextFunction) => {
    const { classID } = req.params;
    const { id } = req.user;

    try {
        // Step 1: Check if class exists
        const classData = await prisma.class.findFirst({ where: { id: classID } });
        if (!classData) {
            return res.status(404).send({ message: 'Class not found' });
        }

        // Step 2: Check if routine exists
        const routine = await prisma.routine.findFirst({ where: { id: classData.routineId } });
        if (!routine) {
            return res.status(404).send({ message: 'Routine not found' });
        }

        // Step 3: Check permission: owner or captain
        const routineMember = await prisma.routineMember.findFirst({
            where: { routineId: routine.id, accountId: id },
        });
        if (!routineMember || (!routineMember.captain && routine.ownerAccountId.toString() !== id)) {
            return res.status(401).json({ message: 'Only captains and owners can update classes' });
        }

        // Attach the necessary data to request object for later use
        req.classData = classData;
        req.routine = routine;
        req.routineMember = routineMember;

        // Proceed to the next middleware or route handler
        next();

    } catch (error) {
        console.error('Error in checkClassAndPermission middleware:', error);
        res.status(500).send({ message: 'Server error' });
    }
};
