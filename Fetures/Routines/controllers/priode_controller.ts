// Imports
import express, { Request, Response } from 'express';

// Models
import Priode from '../models/priode.Models';

import Class from '../models/class.model';
// Helper
import { calculateMidArray } from '../helper/priode.helper';
import Routine from '../models/routine.models';
import Weekday from '../models/weakday.Model';
import { handleValidationError } from '../../../utils/validation_error';



//************  add Priode *************** */
export const add_priode = async (req: any, res: Response) => {
  const { start_time, end_time } = req.body;
  const { routineID } = req.params;

  try {
    console.log(routineID)
    // Check if the routine exists
    const existingRoutine = await Routine.findById(routineID);
    if (!existingRoutine) return res.status(404).send({ message: 'Routine not found' });

    // Count the number of existing prides for the routine
    const priodeCount = await Priode.countDocuments({ rutin_id: routineID });
    // console.log(priodeCount)


    // Create a new priode instance with the next priode number
    const priode = new Priode({
      priode_number: !priodeCount || priodeCount === 0 ? 1 : priodeCount + 1,
      start_time,
      end_time,
      rutin_id: routineID,
    });
    // console.log(priode)

    // Save the priode to the database
    const added = await priode.save();

    res.status(200).send({ message: 'Priode added to routine', added });
  } catch (error: any) {
    console.log(error)
    if (!handleValidationError(res, error)) {
      return res.status(500).send({ message: error.message });
    }
  }
};



//************  delete Priode *************** */
export const delete_priode = async (req: any, res: Response) => {
  const { priode_id } = req.params;

  try {
    // Find the priode to be deleted and its associated routine
    const priode = await Priode.findById(priode_id);
    if (!priode) {
      return res.status(404).send({ message: 'Priode not found' });
    }
    // console.log(priode);

    // Check if the priode is being used in a weekday
    const weekdayUsing = await Weekday.findOne({
      routine_id: priode.rutin_id,
      $or: [
        { start: { $in: [priode.priode_number] } },
        { end: { $in: [priode.priode_number] } },
      ],
    });

    if (weekdayUsing) {
      return res.status(400).send({ message: 'You cannot delete this period because it is now used on other classes' });
    }

    // Calculate the mid array
    const routineID = priode.rutin_id!;
    const mid: number[] = await calculateMidArray(routineID);
    // console.log(mid)
    // Check if priode.priode_number is within valid weekday numbers
    if (mid.includes(priode.priode_number)) {
      return res.status(400).send({ message: 'You cannot delete this period because it is now used on other classes' });
    }

    // Delete the priode
    await priode.deleteOne();

    // Update the priode numbers of the remaining priode in the routine
    const remainingPriode = await Priode.find({ rutin_id: priode.rutin_id })
      .sort({ priode_number: 'asc' });
    let priodeNumber = 1;
    for (let i = 0; i < remainingPriode.length; i++) {
      const currPriode = remainingPriode[i];
      if (currPriode.priode_number !== priodeNumber) {
        currPriode.priode_number = priodeNumber;
        await currPriode.save();
      }
      priodeNumber++;
    }

    res.status(200).send({ message: 'Priode deleted', deleted: priode });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
};

//************  edit priode ***************** */
export const edit_priode = async (req: any, res: Response) => {
  const { start_time, end_time } = req.body;
  const { rutin_id, priodeId } = req.params;

  try {

    // Find the priode to be edited
    const priode = await Priode.findOne({ _id: priodeId });
    if (!priode) return res.status(404).send({ message: 'Priode not found', id: priodeId });

    // Update the priode start and end time
    priode.start_time = start_time;
    priode.end_time = end_time;

    // Save the updated priode to the database
    const updated = await priode.save();

    res.status(200).send({ message: 'Priode updated', updated });
  } catch (error: any) {
    if (!handleValidationError(res, error)) {
      return res.status(500).send({ message: error.message });
    }
  }
};

//************ all priode  *************** */
export const all_priode = async (req: any, res: Response) => {
  const { routineID } = req.params;

  // console.log(`rutin_id: ${routineID}`);

  try {
    const priode = await Priode.find({ rutin_id: routineID });
    res.send({ message: 'All priode list', priodes: priode });

  } catch (error: any) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
};
//************ find priode by id  *************** */

export const find_priode_by_id = async (req: any, res: Response) => {
  const { priode_id } = req.params;

  try {
    // Find the priode by its id
    const priode = await Priode.findById(priode_id);
    if (!priode) return res.status(404).send({ message: 'Priode not found' });

    res.status(200).send(priode);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
};
