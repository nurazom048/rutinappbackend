// Imports
import express, { Request, Response } from 'express';

// Models

import Class from '../models/class.model';
// Helper
import { calculateMidArray } from '../helper/priode.helper';
import Routine from '../models/routine.models';
import Weekday from '../models/weakday.Model';
import { handleValidationError } from '../../../utils/validation_error';
import mongoose from 'mongoose';
import { printD } from '../../../utils/utils';
import PriodeModel from '../models/priode.Models';
import { maineDB } from '../../../connection/mongodb.connection';


//*******************************************************************************/
//--------------------------------- add Priode     ------------------------------/
//*******************************************************************************/



export const add_priode = async (req: any, res: Response) => {
  const { start_time, end_time } = req.body;
  const { routineID } = req.params;

  try {
    console.log("routineID: " + routineID);
    // Check if the routine exists
    const existingRoutine = await Routine.findById(routineID);
    if (!existingRoutine) return res.status(404).send({ message: 'Routine not found' });

    // Count the number of existing prides for the routine
    const priodeCount = await PriodeModel.countDocuments({ rutin_id: routineID });
    // console.log(priodeCount)


    // Create a new priode instance with the next priode number
    const priode = new PriodeModel({
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


//*******************************************************************************/
//--------------------------------- Delete Priode  ------------------------------/
//*******************************************************************************/






export const delete_priode = async (req: any, res: Response) => {

  const { priodeId } = req.params;
  const session = await maineDB.startSession();
  session.startTransaction();

  try {
    // Find the priode to be deleted and its associated routine
    const priode = await PriodeModel.findById(priodeId).session(session);
    console.log(priode)
    if (!priode) {
      return res.status(404).send({ message: 'Priode not found' });
    }

    // Check if the priode is being used in a weekday
    const isPriodeUsedInWeekday = await Weekday.findOne({
      routine_id: priode.rutin_id,
      $or: [
        { start: { $in: [priode.priode_number] } },
        { end: { $in: [priode.priode_number] } },
      ],
    }).session(session);

    if (isPriodeUsedInWeekday) {
      return res.status(400).send({ message: 'You cannot delete this period because it is now used on other classes' });
    }

    // Calculate the mid array
    const routineID = priode.rutin_id!;
    const mid: number[] = await calculateMidArray(routineID);

    // Check if priode.priode_number is within valid weekday numbers
    if (mid.includes(priode.priode_number)) {
      return res.status(400).send({ message: 'You cannot delete this period because it is now used on other classes' });
    }

    // Delete the priode
    await priode.deleteOne();

    // Update the priode numbers of the remaining priodes in the routine
    const remainingPriodes = await PriodeModel.find({ rutin_id: priode.rutin_id })
      .sort({ priode_number: 'asc' }).session(session);

    for (let i = 0; i < remainingPriodes.length; i++) {
      const currPriode = remainingPriodes[i];
      const newPriodeNumber = i + 1;

      if (currPriode.priode_number !== newPriodeNumber) {
        currPriode.priode_number = newPriodeNumber;
        await currPriode.save();
      }
    }

    // Commit the transaction
    await session.commitTransaction();
    res.status(200).send({ message: 'Priode deleted', deleted: priode });
  } catch (error: any) {
    // Handle errors and abortTransition
    console.error(error);

    // Rollback the transaction
    await session.abortTransaction();

    res.status(500).send({ message: error.message });
  }

  finally {
    await session.endSession();
  }
};


//*******************************************************************************/
//--------------------------------- Edit Priode  --------------------------------/
//*******************************************************************************/


export const edit_priode = async (req: any, res: Response) => {
  const { start_time, end_time } = req.body;
  const { rutin_id, priodeId } = req.params;
  console.log("Edit Priode")
  try {

    // Find the priode to be edited
    const priode = await PriodeModel.findOne({ _id: priodeId });
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



//*******************************************************************************/
//---------------------------------All priode  --------------------------------/
//*******************************************************************************/

export const all_priode = async (req: any, res: Response) => {
  const { routineID } = req.params;

  // console.log(`rutin_id: ${routineID}`);

  try {
    const priode = await PriodeModel.find({ rutin_id: routineID });
    res.send({ message: 'All priode list', priodes: priode });

  } catch (error: any) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
};
//*******************************************************************************/
//-----------------------------  Find priode by id -------------------------------/
//*******************************************************************************/

export const find_priode_by_id = async (req: any, res: Response) => {
  const { priode_id } = req.params;

  try {
    // Find the priode by its id
    const priode = await PriodeModel.findById(priode_id);
    if (!priode) return res.status(404).send({ message: 'Priode not found' });

    res.status(200).send(priode);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
};
