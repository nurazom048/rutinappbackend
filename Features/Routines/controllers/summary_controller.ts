import express, { Request, Response } from 'express';
// Models
import Routine from '../models/routine.models';
import Class from '../models/class.model';
import Summary from '../models/summary.models';
import RoutineMember from '../models/routineMembers.Model';
import SaveSummary from '../models/save_summary.model';
import { printD } from '../../../utils/utils';
import { RoutineDB, maineDB } from '../../../prisma/mongodb.connection';

// firebase
import { summaryImageUploader } from '../firebase/summary.firebase';
import prisma from '../../../prisma/schema/prisma.clint';



//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_storage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_storage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();

//***************************************************************************************/
//--------------------------- -add summary  --------------------------------------/
//**************************************************************************************/


// Helper function to check file MIME types
export const addSummary = async (req: any, res: Response) => {
  const { message, checkedType } = req.body;  // Ensure message is passed in the body
  const { class_id } = req.params;
  const { id } = req.user;

  try {
    // Step 1: Check if the message is provided
    if (!message || message.trim() === "" || (req.files.length === 0 && !checkedType)) {
      return res.status(400).send({ message: 'Message is required, or at least one image must be uploaded.' });
    }
    // Step 2: Find the class
    const findClass = await prisma.class.findUnique({
      where: {
        id: class_id,
      },
    });

    if (!findClass) {
      return res.status(404).send({ message: 'Class not found' });
    }


    const routineID = findClass.routineId;
    // Step 2: Check MIME types of uploaded files
    const allowedMimeTypes = ['image/jpeg', 'image/png']; // Add more allowed MIME types if needed
    // const invalidFiles = req.files.filter(file => !allowedMimeTypes.includes(file.mimetype));
    const invalidFiles = req.files.filter((file: any) => !allowedMimeTypes.includes(file.mimetype));
    //console.log(invalidFiles)
    if (invalidFiles.length > 0 && !checkedType) {
      const invalidFileNames = invalidFiles.map((file: any) => file.originalname);
      return res.status(400).send({ message: `Invalid file types: ${invalidFileNames.join(', ')}` });
    }

    // Step 2: Upload summary's to Firebase Storage
    const downloadUrls = await summaryImageUploader(
      {
        files: req.files,
        class_id,
        routineID: routineID,
      });

    // Step 4: Perform database operations in a transaction
    const createdSummary = await prisma.$transaction(async (tx) => {
      const summary = await tx.summary.create({
        data: {
          ownerId: id,
          text: message.trim() === "" && downloadUrls.length > 0 ? '' : message,  // Check if message is empty and if images exist
          imageLinks: downloadUrls,
          imageStorageProvider: 'firebase',
          routineId: routineID,
          classId: findClass.id,
        },
      });

      // Update routine's updatedAt field
      await tx.routine.update({
        where: {
          id: routineID,
        },
        data: {
          updatedAt: new Date(), // Update the timestamp
        },
      });

      return summary;
    });

    // Step 5: Send response
    return res.status(201).json({
      message: 'Summary created successfully',
      summary: createdSummary,
      // downloadUrls,
    });
  } catch (error: any) {
    // Send detailed error response
    return res.status(400).json({ message: error.message });
  }
};


//***************************************************************************************/
//--------------------------- -Get class summary list  ----------------------------------/
//**************************************************************************************/

//## Here you can get saved summary or summary by class ID

export const get_class_summary_list = async (req: any, res: Response) => {
  const { class_id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    // Note: If no class ID is provided, load saved summaries
    if (!class_id) {
      // TODO: Fetch saved summaries for the user
      // You can implement logic to fetch saved summaries based on user ID here
      // Example:
      // const savedSummaries = await prisma.savedSummary.findMany({
      //   where: { savedByAccountId: req.user.id },
      //   include: {
      //     summary: {
      //       include: {
      //         owner: {
      //           select: {
      //             id: true,
      //             username: true,
      //             name: true,
      //             image: true,
      //           },
      //         },
      //       },
      //     },
      //   },
      // });

      /// and if class id loade summary where clasid == classid 





      // return res.status(200).json({
      //   message: 'Saved summaries fetched successfully',
      //   summaries: savedSummaries,
      // });
    }

    // Check if the class exists
    const classInstance = await prisma.class.findUnique({
      where: { id: class_id },
    });

    if (!classInstance) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Count total summaries for the class
    const count = await prisma.summary.count({
      where: { classId: class_id },
    });

    // Fetch summaries with pagination and include related owner details
    const summaries = await prisma.summary.findMany({
      where: { classId: class_id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }, // Sort summaries by creation date descending
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    // Send response directly with raw summaries
    return res.status(200).json({
      message: 'Summaries fetched successfully',
      summaries, // Return the summaries as-is
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      totalCount: count,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'An error occurred' });
  }
};



//************ update  summary list *************** */
export const update_summary = async (req: any, res: Response) => {
  const { summary_id } = req.params;
  const { id } = req.user;

  try {
    // find the class that contains the summary
    const finsSummary = await Summary.findByIdAndUpdate(summary_id, { text: req.body.text });
    // const classInstance = await Class.findOne({ 'summary._id': summary_id });
    if (!finsSummary) return res.status(404).json({ message: 'Summary not found' });

    // find the routine that contains the class and check if the current user has permission to edit
    const routineInstance = await Routine.findById(finsSummary.id);
    if (!routineInstance) return res.status(404).json({ message: 'Routine not found' });
    if (id !== routineInstance.ownerid.toString() && finsSummary.ownerId !== id)
      return res.status(401).json({ message: 'You do not have permission to edit a summary' });

    // update the summary and send response
    const updatedSummary = await Summary.findByIdAndUpdate(summary_id, { text: req.body.text });
    if (!updatedSummary) {
      return res.status(404).json({ message: "Summary not found" });
    }
    return res.status(200).send({ message: "Summary Updated successfully" });
  } catch (error: any) {
    return res.status(400).send(error.message);
  }
};

//************* SUMMARY STATUS ********************/
export const summary_status = async (req: any, res: Response) => {
  try {
    const { summary_id } = req.params;
    const { id } = req.user;

    // console.log("summary_status id");
    // console.log(summary_id);


    let summaryOwner = false;
    let isOwner = false;
    let isCaptain = false;
    let isSummarySaved = false;

    // Find the Summary to check user status
    const foundSummary = await Summary.findById(summary_id);
    if (!foundSummary) {
      return res.status(500).json({ message: 'Summary Not Found' });
    }

    console.log(id)
    if (foundSummary.ownerId == id) {
      summaryOwner = true;
    }

    // Find the routine to check user status
    const routine = await Routine.findOne({ _id: foundSummary.routineId });
    console.log(routine)
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    // Check if the user is the owner
    const isOwnerFind = await RoutineMember.findOne({ memberID: id, RutineID: foundSummary.routineId, owner: true });
    if (isOwnerFind) {
      isOwner = true;
    }

    // Check if the user is a captain
    const isCaptainFind = await RoutineMember.findOne({ memberID: req.user.id, RutineID: foundSummary.routineId, captain: true });
    if (isCaptainFind) {
      isCaptain = true;
    }


    const ifsvaed = await SaveSummary.findOne({ summaryId: foundSummary.id, savedByAccountId: id });
    if (ifsvaed) {
      isSummarySaved = true
    }

    res.status(200).json({
      summaryOwner,
      isOwner,
      isCaptain,
      isSummarySaved,

    });
  } catch (error: any) {
    console.log(error);

    return res.status(500).json({ message: error.message });
  }
};
//*************************************************************************************/
//--------------------------------- saveUnsaveSummary ----------------------------------/
//*************************************************************************************/


export const saveUnsaveSummary = async (req: any, res: Response) => {
  try {
    const { save, summaryId } = req.body;

    // Find the summary by ID
    const foundSummary = await Summary.findById(summaryId);
    console.log('Summary found:', foundSummary);
    if (!foundSummary) {
      return res.status(404).json({ message: 'Summary not found' });
    }


    const query = {
      summaryId: foundSummary._id,
      routineId: foundSummary.routineId,
      savedByAccountId: req.user.id,
      classID: foundSummary.classId,
    };


    switch (save) {
      case 'true':
        // Check if the summary is already saved
        const isSaved = await SaveSummary.findOne(query);
        if (isSaved) {
          return res.status(409).json({ message: 'Summary already saved' });
        }

        // Create a new SaveSummary document
        const saveSummary = new SaveSummary(query);

        // Save the summary
        const savedSummary = await saveSummary.save();

        return res.status(200).json({
          message: 'Summary saved successfully',
          save: true,
          savedSummary,
        });

      case 'false':
        // Find the saved summary by summary ID and user ID
        const ifSaved = await SaveSummary.findOne(
          {
            summaryId: foundSummary._id,
            routineId: foundSummary.routineId,
            savedByAccountId: req.user.id,
          });
        console.log('Found Summary to Unsave:', ifSaved); // Add logging for debugging

        if (!ifSaved) {
          return res.status(404).json({ message: 'Saved summary not found' });
        }

        // Remove the saved summary
        await SaveSummary.findOneAndDelete({
          summaryId: foundSummary._id,
          routineId: foundSummary.routineId,
          savedByAccountId: req.user.id,
        });

        return res.status(200).json({
          message: 'Summary unsaved successfully',
          save: false,
        });

      default:
        return res.status(400).json({ message: 'Save condition is required' });
    }
  } catch (error: any) {
    console.error('Error:', error); // Add logging for debugging
    return res.status(500).json({ message: error.message });
  }
};
//*************************************************************************************/
//--------------------------------- Remove Summary ----------------------------------/
//*************************************************************************************/
export const remove_summary = async (req: any, res: Response) => {
  const { summary_id } = req.params;
  const { id } = req.user;
  const session = await RoutineDB.startSession();
  session.startTransaction();

  try {
    let isCaptain = false;

    // Find the summary to be removed
    const findSummary = await Summary.findById(summary_id);
    if (!findSummary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    // Find the routine to check permission
    const routine = await Routine.findOne({ _id: findSummary.routineId });
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    // Check if the user is a captain
    const isCaptainFind = await RoutineMember.findOne({ memberID: req.user.id, RutineID: findSummary.routineId, captain: true, });
    if (isCaptainFind) {
      isCaptain = true;
    }

    // Only summary owner, routine owner, or captains can delete
    const deletePermission = findSummary.ownerId !== id || routine.ownerid == id || isCaptain;
    if (!deletePermission) {
      return res.status(403).json({ message: "You don't have permission to delete" });
    }

    // Step 1: Delete associated save records
    await SaveSummary.deleteMany({ summaryId: summary_id }).session(session);

    // Step 2: Delete the summary from MongoDB
    await Summary.findByIdAndDelete(summary_id).session(session);
    // Step 3: Delete the summary from Firebase storage
    for (const imageLink of findSummary.imageLinks ?? []) {
      const fileRef = ref(storage, imageLink);
      await deleteObject(fileRef);
    }

    await session.commitTransaction();

    return res.status(200).json({ message: "Summary deleted successfully" });
  } catch (error: any) {
    console.log('From delete summary');
    console.log(error);
    await session.abortTransaction();
    return res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

