import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Models
import Routine from '../models/routine.models';
import Class from '../models/class.model';
import Weekday from '../models/weakday.Model';
import RoutineMember from '../models/routineMembers.Model';


// routine firebase and helper
import { deleteSummariesFromFirebaseBaseOnClassId } from '../firebase/summary.firebase';
import { getClasses } from '../helper/class.helper';
import { handleValidationError } from '../../../utils/validation_error';
import { printD } from '../../../utils/utils';
import { RoutineDB } from '../../../prisma/mongodb.connection';
import SaveSummary from '../models/save_summary.model';
import Summary from '../models/summary.models';
import prisma from '../../../prisma/schema/prisma.clint';


//! firebase 
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_storage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_storage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();

//*******************************************************************************/
//---------------------------------  create class   ------------------------------/
//*******************************************************************************/
export const create_class = async (req: any, res: Response) => {
  const { name, subjectCode, instructorName, startTime, endTime, room, weekday } = req.body;
  const { routineId } = req.params;

  try {
    const result = await prisma.$transaction(async (prisma) => {
      // Create the class
      const createdClass = await prisma.class.create({
        data: {
          name,
          subjectCode,
          instructorName,
          routineId,
        },
      });

      // Create associated weekday
      const createdWeekday = await prisma.weekday.create({
        data: {
          class: {
            connect: { id: createdClass.id }, // Connect to the created class
          },
          routine: {
            connect: { id: routineId }, // Connect to the routine
          },
          Day: weekday, // Enum or string for the day
          room,
          startTime,
          endTime,
        },
      });

      return { createdClass, createdWeekday };
    });

    // Respond with the created class and weekday
    return res.status(201).json({
      message: "Class and weekday created successfully",
      class: result.createdClass,
      weekday: result.createdWeekday,
    });
  } catch (error: any) {
    console.error({ message: "Error creating class and weekday", error });
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


//*******************************************************************************/
//-------------------------------- -Add weekday to class ------------------------------/
//*******************************************************************************/

export const addWeekday = async (req: any, res: Response) => {
  // Come after middleware
  const { classID } = req.params;
  const { num, room, start_time, end_time, start_time_2, end_time_2 } = req.body;
  console.log(req.body)

  try {
    //
    const classFind = await Class.findById(classID);
    if (!classFind) return res.status(404).send({ message: 'Class not found' });

    // create and save new weekday
    const newWeekday = new Weekday({
      class_id: classID,
      routine_id: classFind.routine_id.toString(),
      num,
      room: room,
      start_time,
      end_time,
      start_time_2,
      end_time_2,
    });
    await newWeekday.save();

    // add new weekday to the weekday array of the routine
    classFind.weekday.push(newWeekday._id);
    await classFind.save();

    res.send({ message: 'Weekday added successfully', newWeekday });
  } catch (error: any) {
    if (!handleValidationError(res, error)) {
      return res.status(500).send({ message: error.message });
    }
  }
};
//******* deleteWeekdayById ************** */
export const deleteWeekdayById = async (req: any, res: Response) => {
  const { id, classID } = req.params;

  try {
    // Check if the class has at least 1 weekday
    const weekdaysCount = await Weekday.countDocuments({ class_id: classID });
    if (weekdaysCount === 1) {
      return res.status(404).send({ message: 'Class must have at least 1 weekday, cannot delete it' });
    }

    // Find and delete the weekday
    const weekday = await Weekday.findOneAndDelete({ _id: id });
    if (!weekday) {
      return res.status(404).send('Weekday not found');
    }

    // Find the remaining weekdays for the class
    const weekdays = await Weekday.find({ class_id: classID });
    console.log({ message: 'Weekday deleted successfully', weekdays })
    res.send({ message: 'Weekday deleted successfully', weekdays });
  } catch (error: any) {
    res.status(500).send({ message: error.message, weekdays: [] });
  }
};



//******* show all weekday in a class ************** */

export const allWeekdayInClass = async (req: any, res: Response) => {

  const { ClassID } = req.params;

  try {
    if (!ClassID) return res.status(500).send({ message: "ClassId not found", weekdays: [] });
    // 1 weekdays
    const weekdays = await prisma.weekday.findMany({ where: { classId: ClassID } });

    res.send({ message: "All weekday in the class", weekdays });
  } catch (error: any) {
    console.log(error)
    return res.status(500).send({ message: error.toString, weekdays: [] });

  }

}

//*************************************************************************/
//-------------------------  edit_class   ---------------------------------/
//*************************************************************************/
export const edit_class = async (req: any, res: Response) => {
  const { classID } = req.params;
  const { name, instructorName, subjectCode } = req.body;

  try {

    //  Update the class details
    const updatedClass = await prisma.class.update({
      where: { id: classID },
      data: {
        name,
        instructorName,
        subjectCode,
      },
    });

    // Step 5: Return updated class data
    return res.status(200).json({
      class: updatedClass,
      message: 'Class updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating class:', error);
    res.status(500).send({ message: error.message });
  }
};

//**********************************************************************/
//-------------------- Delete Class ------------------------------------//
//**********************************************************************/

export const remove_class = async (req: any, res: Response) => {
  const { classID } = req.params;
  const { id } = req.user;

  console.log('Request to delete class');

  const session = await prisma.$transaction(async (tx) => {
    try {
      // Step 1: Find the class
      const findClass = await tx.class.findUnique({
        where: { id: classID },
      });
      if (!findClass) throw new Error('Class not found');

      // Step 2: Check permission (find the routine)
      const routine = await tx.routine.findUnique({
        where: { id: findClass.routineId },
      });
      if (!routine) throw new Error('Routine not found');

      // Step 3: Delete associated summaries
      const summaries = await tx.summary.findMany({
        where: { classId: classID },
      });

      // Delete summaries and their files from Firebase storage
      for (const summary of summaries) {
        for (const imageLink of summary.imageLinks ?? []) {
          const fileRef = ref(storage, imageLink);
          await deleteObject(fileRef);
        }
        await tx.summary.delete({
          where: { id: summary.id },
        });
      }

      // Step 4: Delete associated weekdays
      await tx.weekday.deleteMany({
        where: { classId: classID },
      });

      // Step 5: Delete the class
      await tx.class.delete({
        where: { id: classID },
      });

      return { message: 'Class deleted successfully' };
    } catch (error) {
      throw error; // Re-throw error to be caught by the outer try-catch
    }
  });

  try {
    // Commit transaction and respond
    res.send({ message: session.message });
  } catch (error) {
    console.error('Error in remove_class:', error);
    res.status(500).send({ message: (error as any).message });
  }
};



//************ show_weekday_classes *************** */
export const show_weekday_classes = async (req: any, res: Response) => {
  const { routineID, weekday } = req.params;
  console.log(weekday);
  try {
    const routine = await Routine.findById(routineID);
    if (!routine) return res.status(404).send('Routine not found');

    const classes = await Class.find({
      weekday: 1,
      rutin_id: routineID,
    }).sort({ start_time: 1 });

    res.send({ classes });
  } catch (error: any) {
    res.status(400).send({ error });
  }
};

//*********************************************************************************************/
//---------------------------- Full Routine or All Class --------------------------------------/
//*********************************************************************************************/

export const allClass = async (req: any, res: Response) => {

  const { routineID } = req.params;
  console.log(routineID);

  try {
    // Check if the routine exists
    const routine = await prisma.routine.findUnique({
      where: { id: routineID },
      include: {
        routineOwner: { // Include owner details in the routine query
          select: {
            id: true,
            name: true,
            username: true,
            image: true, // Include image if required
          },
        },
      },
    });
    if (!routine) {
      return res.status(404).json({ message: 'Routine not found' });
    }

    // Fetch all classes related to the routine without including weekdays or timestamps
    const classes = await prisma.class.findMany({
      where: { routineId: routineID },
      select: {
        id: true,
        name: true,
        instructorName: true,
        subjectCode: true,
        routineId: true,
      }, // Exclude createdAt and updatedAt
    });


    // Initialize weekdays structure for grouping
    const weekdayClasses: { [key: string]: any[] } = { sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] };
    // Group classes by weekdays
    const classesWithWeekdays = await prisma.class.findMany({
      where: { routineId: routineID },
      include: {
        weekdays: true, // Include weekdays for grouping
      },
    });

    classesWithWeekdays.forEach((classItem) => {
      classItem.weekdays.forEach((weekday) => {
        const dayKey = weekday.Day.toLowerCase(); // Get the day directly

        if (weekdayClasses[dayKey]) {
          // Use the class and weekday properties directly
          weekdayClasses[dayKey].push({
            ...classItem,
            room: weekday.room,
            startTime: weekday.startTime,
            endTime: weekday.endTime,
          });
        } else {
          console.warn(`Invalid weekday: ${weekday.Day} for class: ${classItem.id}`);
        }
      });
    });
    const { id, name, username, image } = routine.routineOwner;

    // Prepare the final response
    const response = {
      allClass: classes,
      weekdayClasses,
      owner: { id, name, username, image },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


//************   findClass       *************** */
export const findClass = async (req: any, res: Response) => {
  const { classID } = req.params;
  console.log(classID + 'find class');

  try {
    // step:1 find classes
    const classes = await prisma.class.findFirst({ where: { id: classID } });
    if (!classes) return res.status(404).send({ message: 'Class not found' });

    // step:2 find weekday
    const weekdays = await prisma.class.findFirst({ where: { id: classID } });
    console.log({ message: "All weekday in the class", classes, weekdays })

    // step:3 send response
    res.status(200).send({ message: "All weekday in the class", classes, weekdays });


  } catch (error: any) {
    console.error(error);

    res.status(500).send({ message: 'Error updating class', weekdays: [] });
  }
};


//*********************************************************************** */
//------------------------- class Notification Time -----------------------//
//*********************************************************************** */


export const classNotification = async (req: any, res: Response) => {
  const { id } = req.user;

  try {
    // Step 1: Get all routine IDs where the user is a member
    const findRoutines = await RoutineMember.find({ memberID: id });
    if (!findRoutines) {
      return res.status(404).send({ message: 'No routines found for the user' });
    }

    // Convert ObjectId to string and filter out null/undefined routine IDs
    const filteredRoutineIds = findRoutines
      .map(routine => routine.RutineID?.toString())
      .filter(Boolean);

    // Step 2: Find weekdays associated with the routine IDs and populate class_id and routine_id
    const allDaysWithNull = await Weekday.find({ routine_id: { $in: filteredRoutineIds } })
      .populate({
        path: 'class_id',
        select: '-weekday' // Exclude the 'weekday' field from the populated 'class_id' object
      });

    // Filter out weekdays that do not have a valid class_id
    const allDays = allDaysWithNull.filter(weekday => weekday.class_id !== null);

    // Step 3: Send response with the filtered weekdays
    res.send({ allClassForNotification: allDays });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server Error', notificationOnClasses: [] });
  }
};
