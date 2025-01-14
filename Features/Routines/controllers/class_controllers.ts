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
//----------------------------Add weekday to class ------------------------------/
//*******************************************************************************/

export const addWeekday = async (req: Request, res: Response) => {
  const { classID } = req.params;
  const { day, room, startTime, endTime } = req.body;

  try {
    // Start the transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Find the class and related routine
      const classFind = await tx.class.findUnique({
        where: { id: classID },
        include: {
          routine: true, // Ensure that the related routine is fetched
        },
      });

      if (!classFind) throw new Error('Class not found'); // Throw an error to roll back the transaction

      const routineId = classFind.routineId; // Get routineId from the class

      // Create the new weekday record using Prisma
      const newWeekday = await tx.weekday.create({
        data: {
          classId: classID,
          routineId: routineId, // Relate to the found routine
          Day: day.toLowerCase(), // Assuming `day` is passed as a string (e.g., "mon", "tue")
          room: room,
          startTime: new Date(startTime), // Assuming startTime and endTime are ISO strings
          endTime: new Date(endTime),
        },
      });

      // Add the new weekday to the routine's weekdays array (relational integrity handled automatically by Prisma)
      await tx.routine.update({
        where: { id: routineId },
        data: {
          weekdays: {
            connect: {
              id: newWeekday.id, // Connect the new weekday to the routine
            },
          },
        },
      });

      // Return the new weekday if everything is successful
      return newWeekday;
    });

    // Send the success response
    res.send({ message: 'Weekday added successfully', newWeekday: transaction });
  } catch (error) {
    // Handle any errors that occur
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
};
//*******************************************************************************/
//---------------------------- deleteWeekdayById --------------------------------/
//*******************************************************************************/

export const deleteWeekdayById = async (req: Request, res: Response) => {
  const { weekdayID } = req.params;

  try {
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Fetch the weekday and associated class
      const weekday = await tx.weekday.findUnique({
        where: { id: weekdayID },
        select: { id: true, classId: true },
      });

      if (!weekday) {
        throw new Error('Weekday not found');
      }

      // Ensure the class has at least one remaining weekday
      const weekdayCount = await tx.weekday.count({
        where: { classId: weekday.classId },
      });

      if (weekdayCount <= 1) {
        throw new Error('Class must have at least one weekday. Deletion not allowed.');
      }

      // Delete the weekday
      const deletedWeekday = await tx.weekday.delete({
        where: { id: weekdayID },
      });

      // Fetch remaining weekdays in the class
      const remainingWeekdays = await tx.weekday.findMany({
        where: { classId: weekday.classId },
      });

      return { deletedWeekday, remainingWeekdays };
    });

    // Return success response
    res.status(200).json({
      message: 'Weekday deleted successfully',
      deletedWeekday: result.deletedWeekday,
      weekdays: result.remainingWeekdays,
    });
  } catch (error: any) {
    console.error('Error deleting weekday:', error);
    res.status(500).json({ message: error.message || 'Internal server error', weekdays: [] });
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
    const routineMembers = await prisma.routineMember.findMany({
      where: { accountId: id },
      select: { routineId: true },
    });

    if (routineMembers.length === 0) {
      return res.status(404).json({ message: 'No routines found for the user' });
    }

    // Extract routine IDs from the results
    const routineIds = routineMembers.map((member) => member.routineId);

    // Step 2: Find weekdays associated with the routine IDs
    const weekdaysWithClasses = await prisma.weekday.findMany({
      where: { routineId: { in: routineIds } },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            instructorName: true,
            subjectCode: true,
          },
        },
      },
    });

    // Filter out weekdays without valid classes
    const validWeekdays = weekdaysWithClasses.filter((weekday) => weekday.class !== null);

    // Step 3: Send response with the filtered weekdays and class information
    res.status(200).json({ allClassForNotification: validWeekdays });

  } catch (error) {
    console.error('Error fetching class notifications:', error);
    res.status(500).json({ message: 'Server Error', notificationOnClasses: [] });
  }
};
