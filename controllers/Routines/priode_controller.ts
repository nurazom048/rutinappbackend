
import express, { Request, Response } from 'express';

import { handleValidationError } from '../../method/validation_error';
// Models
import Priode from '../../models/Routines Models/priode.Models';
import Weekday from '../../models/Routines Models/weakday.Model';
import Routine from '../../models/Routines Models/routine.models';
import Class from '../../models/Routines Models/class.model';



//************  add Priode *************** */
export const add_priode = async (req: any, res: Response) => {
  const { start_time, end_time } = req.body;
  const { rutin_id } = req.params;

  try {
    // Check if the routine exists
    const existingRoutine = await Routine.findOne({ _id: rutin_id });
    if (!existingRoutine) return res.status(404).send({ message: 'Routine not found' });

    // Count the number of existing priodes for the routine
    const priodeCount = await Priode.countDocuments({ rutin_id });
    console.log(priodeCount)


    // Create a new priode instance with the next priode number
    const priode = new Priode({
      priode_number: !priodeCount || priodeCount === 0 ? 1 : priodeCount + 1,
      start_time,
      end_time,
      rutin_id,
    });
    console.log(priode)

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




// const findPriodes = await Priode.find({ rutin_id });
// console.log(findPriodes)

// const allMidProdesNumber = [];
// const getMidpriodeNumber(findPriodes){

//   if (findPriodes.lenght !== 0) {
//     for (i = 0, findPriodes.lenght = i, i++) {
//       if (
//         findPriodes[i].end_time - findPriodes[i].start > 1) {

//         for (j, j = findPriodes[i].end_time, j++ ) {
//           allMidProdesNumber.add(j)
//         }
//       }

//       //get mid priode number and add to allMidProdesNumber[] list 

//     }
//   }
// }

// const thisMidPriodeIsnNot_free = await Routine.findOne({
//   _id: rutin_id, $or: [
//     { start: { $in: [priode.priode_number] } },
//     { end: { $in: [priode.priode_number] } }
//   ]
// });
// if (thisMidPriodeIsnNot_free) return res.status(404).send({ message: 'Ths start : ${start} or end priode is allrady using ' });
//************  delete Priode *************** */
export const delete_priode = async (req: any, res: Response) => {
  const { priode_id } = req.params;

  try {
    // Find the priode to be deleted and its associated routine
    const priode = await Priode.findOne({ _id: priode_id }).populate('rutin_id');
    if (!priode) return res.status(404).send({ message: 'Priode not found' });

    // step 2 chack the priode number is allrady using or not 
    const weekdayUsing = await Weekday.findOne({
      routine_id: priode.rutin_id,
      $or: [
        { start: { $in: [priode.priode_number] } },
        { end: { $in: [priode.priode_number] } }
      ]
    });
    if (weekdayUsing) return res.status(404).send({ message: 'Cannot delete this priode because it is being used in a weekday' });



    // Delete the priode
    await priode.deleteOne();

    // Update the priode numbers of the remaining priodes in the routine
    const remainingPriodes = await Priode.find({ rutin_id: priode.rutin_id })
      .sort({ priode_number: 'asc' });
    let priodeNumber = 1;
    for (let i = 0; i < remainingPriodes.length; i++) {
      const currPriode = remainingPriodes[i];
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


//************  eddit priode ***************** */
export const edit_priode = async (req: any, res: Response) => {
  const { start_time, end_time } = req.body;
  const { rutin_id, priode_id } = req.params;

  try {
    // // Check if the routine exists
    // const existingRoutine = await Routine.findOne({ _id: rutin_id });
    // if (!existingRoutine) return res.status(404).send({ message: 'Routine not found' });

    // Find the priode to be edited
    const priode = await Priode.findOne({ _id: priode_id });
    if (!priode) return res.status(404).send({ message: 'Priode not found' });

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
  const { rutin_id } = req.params;

  console.log(`rutin_id: ${rutin_id}`);

  try {
    const priodes = await Priode.find({ rutin_id });
    res.send({ message: 'All priodes list', priodes });

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
