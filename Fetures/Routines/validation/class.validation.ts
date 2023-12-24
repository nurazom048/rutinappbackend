import { Request, Response, NextFunction } from 'express';
import Routine from '../models/routine.models';
import RoutineMember from '../models/routineMembers.Model';
import Weekday from '../models/weakday.Model';
import Priode from '../models/priode.Models';

export const classValidation = (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body)
    try {
        const { name, instuctor_name, subjectcode, room, weekday } = req.body;
        const { routineID } = req.params;

        // Check if required fields are provided
        if (!name) {
            return res.status(400).send({ message: 'Validation failed: name is required' });
        }
        if (!instuctor_name) {
            return res.status(400).send({ message: 'Validation failed: instructor_name is required' });
        }
        if (!subjectcode) {
            return res.status(400).send({ message: 'Validation failed: subjectcode is required' });
        }
        if (!weekday) {
            return res.status(400).send({ message: 'Validation failed: weekday is required' });
        }
        if (!room) {
            return res.status(400).send({ message: 'Validation failed: room number is required' });
        }
        if (!routineID) {
            return res.status(400).send({ message: 'Validation failed: routineID is required' });
        }

        // If all validations pass, proceed to the next middleware/controller
        next();
    } catch (error) {
        // Handle any errors that occur during validation
        res.status(500).send({ message: 'Internal server error' });
    }
};



export const validateClassBookingAndPeremption = async (req: any, res: Response, next: NextFunction) => {
    const { weekday, start, end } = req.body;
    const { routineID } = req.params;
    const userID = req.user.id;

    try {
        // Find Routine to check the owner
        const findRoutine = await Routine.findOne({ _id: routineID });
        if (!findRoutine) return res.status(401).json({ message: "Routine not found" });

        // Check permission: owner or captain
        const routineMember = await RoutineMember.findOne({ RutineID: routineID, memberID: userID });
        if (!routineMember || (!routineMember.owner && !routineMember.captain)) {
            return res.status(401).json({ message: "Only captains and owners can add classes" });
        }

        // Validation 1: Check if priode exist
        const findEnd = await Priode.findOne({ rutin_id: routineID, priode_number: start });
        const findStartPriode = await Priode.findOne({ rutin_id: routineID, priode_number: end });
        if (!findEnd) return res.status(404).send({ message: `${end} priode is not created` });
        if (!findStartPriode) return res.status(404).send({ message: `${start} priode is not created` });

        // Validation 2: Check for booking
        const startPriodeAlreadyBooked = await Weekday.findOne({ routine_id: routineID, num: weekday, start });
        if (startPriodeAlreadyBooked) return res.status(404).send({ message: 'Start priode is already booked' });
        const endPriodeAlreadyBooked = await Weekday.findOne({ routine_id: routineID, num: weekday, end });
        if (endPriodeAlreadyBooked) return res.status(404).send({ message: 'End priode is already booked' });

        // Find all the start and end priode in the given num
        const allStart = await Weekday.find({ routine_id: routineID, num: weekday }, { start: 1 });
        const allEnd = await Weekday.find({ routine_id: routineID, num: weekday }, { end: 1 });

        const mid = [];
        for (let i = 0; i < allStart.length; i++) {
            for (let j = allStart[i].start + 1; j < allEnd[i].end; j++) {
                mid.push(j);
            }
        }

        // Check if the start or end priode are already booked in the middle
        if (mid.includes(start)) return res.status(400).send({ message: `${start} This period is already booked up to ${mid}` });
        if (mid.includes(end)) return res.status(400).send({ message: `This ${end} period is already booked up to ${mid}` });


        //
        req.validateClassBookingAndPeremption = { routineID, weekday, start, end };
        // If all validations pass, proceed to the next middleware or route handler
        next();
    } catch (error: any) {
        return res.status(500).send({ message: 'Internal Server Error' });
    }
};

