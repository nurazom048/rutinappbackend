import Class from '../../../models/Routines Models/class.model';
import Priode from '../../../models/Routines Models/priode.Models';
import Routine from '../../../models/Routines Models/routine.models';
import Weekday from '../../../models/Routines Models/weakday.Model';
import { Request, Response, NextFunction } from 'express';


// WEEKDAY validation


export const validateWeekdayMiddleware = async (req: any, res: Response, next: NextFunction) => {
  const { classID } = req.params;
  const { num, start, end } = req.body;

  try {
    // Check required fields
    if (!num) {
      return res.status(400).send({ message: 'Weekday number is required' });
    }
    if (!start) {
      return res.status(400).send({ message: 'Start period is required' });
    }
    if (!end) {
      return res.status(400).send({ message: 'End period is required' });
    }

    // Check from database
    const classFind = await Class.findById(classID);
    if (!classFind) {
      return res.status(404).send({ message: 'Class not found' });
    }

    const routine = await Routine.findOne({ _id: classFind.rutin_id });
    if (!routine) {
      return res.status(404).send({ message: 'Routine not found' });
    }

    // Period not created validations
    const findEnd = await Priode.findOne({ rutin_id: classFind.rutin_id, priode_number: start });
    const findStartPriod = await Priode.findOne({ rutin_id: classFind.rutin_id, priode_number: end });
    if (!findEnd) {
      return res.status(404).send({ message: `${end} period is not created` });
    }
    if (!findStartPriod) {
      return res.status(404).send({ message: `${start} period is not created` });
    }

    // Validation to check booking
    const startPriodeAlreadyBooked = await Weekday.findOne({ routine_id: classFind.rutin_id, num, start });
    if (startPriodeAlreadyBooked) {
      return res.status(404).send({ message: 'Start period is already booked' });
    }

    const endPriodeAlreadyBooked = await Weekday.findOne({ routine_id: classFind.rutin_id, num, end });
    if (endPriodeAlreadyBooked) {
      return res.status(404).send({ message: 'End period is already booked' });
    }

    // Check if any period is already booked within the range
    const mid: number[] = [];
    const allStart = await Weekday.find({ num });
    const allEnd = await Weekday.find({ num }, { end: 1 });

    for (let i = 0; i < allStart.length; i++) {
      for (let j = allStart[i].start + 1; j < allEnd[i].end; j++) {
        mid.push(j);
      }
    }

    if (mid.includes(start)) {
      return res.status(400).send({ message: `${start} This period is already booked. All bookings up to ${mid}` });
    }
    if (mid.includes(end)) {
      return res.status(400).send({ message: `This ${end} period is already booked. All bookings up to ${mid}` });
    }

    req.classFind = classFind;
    req.routine = routine;
    next();
  } catch (error: any) {
    return res.status(500).send({ message: error.message });
  }
};

//




export const Routine_Owner = async (req: any, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const routine = await Routine.findById(id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    if (routine.ownerid.toString() !== req.user.id) {
      return res.status(401).json({ message: "Unauthorized to delete routine" });
    }

    next();
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
