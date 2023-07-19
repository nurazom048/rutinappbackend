import express, { Request, Response } from 'express';

const Account = require('../../models/Account_model/Account.Model')
const Routine = require('../../models/Routines Models/routine_models')
const Class = require('../../models/Routines Models/class.model');
const Summary = require('../../models/Routines Models/summary.models');
const RoutineMember = require('../../models/Routines Models/rutineMembersModel')
const SaveSummary = require('../../models/Routines Models/save_summary.model')


// firebase

const { summaryImageUploader } = require('../../controllers/Routines/firebase/summary.firebase')



//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_storage = require("../../config/firebase/firebase_storage");
initializeApp(firebase_storage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();

//************   create summary        *************** *//

// Create Summary
export const create_summary = async (req: any, res: Response) => {
  const { message } = req.body;
  const { class_id } = req.params;
  const { id } = req.user;

  try {
    // Step 1: Find class
    const findClass = await Class.findOne({ _id: class_id });
    if (!findClass) return res.status(404).send({ message: 'Class not found' });

    // Step 2: Check MIME types of uploaded files
    const allowedMimeTypes = ['image/jpeg', 'image/png']; // Add more allowed MIME types if needed
    // const invalidFiles = req.files.filter(file => !allowedMimeTypes.includes(file.mimetype));
    const invalidFiles = req.files.filter((file: any) => !allowedMimeTypes.includes(file.mimetype));

    if (invalidFiles.length > 0) {
      //const invalidFileNames = invalidFiles.map(file => file.originalname);
      const invalidFileNames = invalidFiles.map((file: any) => file.originalname);

      return res.status(400).send({ message: `Invalid file types: ${invalidFileNames.join(', ')}` });
    }

    // Step 2: Upload summary's to Firebase Storage
    const downloadUrls = await summaryImageUploader({ files: req.files, class_id });

    // Step 3: Create instance
    const summary = new Summary({
      ownerId: id,
      text: message,
      imageLinks: downloadUrls,
      routineId: findClass.rutin_id,
      classId: findClass.id,
    });

    // Step 4: Save and send response
    const createdSummary = await summary.save();
    console.log(createdSummary);
    console.log(id);
    return res.status(201).json({
      message: 'Summary created successfully',
      summary: createdSummary,
      downloadUrls,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

// Remove Summary
export const remove_summary = async (req: any, res: Response) => {
  const { summary_id } = req.params;
  const { id } = req.user;

  try {
    let isCaptain = false;

    // Find the summary to be removed
    const findSummary = await Summary.findOne({ _id: summary_id });
    if (!findSummary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    // Find the routine to check permission
    const routine = await Routine.findOne({ _id: findSummary.routineId });
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    // Check if the user is a captain
    const isCaptainFind = await RoutineMember.findOne({ memberID: req.user.id, RutineID: findSummary.routineId, captain: true });
    if (isCaptainFind) {
      isCaptain = true;
    }

    // Only summary owner, routine owner, or captains can delete
    const deletePermission = findSummary.ownerId !== id || routine.ownerId == id || isCaptain;
    if (!deletePermission) {
      return res.status(403).json({ message: "You don't have permission to delete" });
    }

    // Step 1: Delete the summary from Firebase storage
    for (const imageLink of findSummary.imageLinks) {
      const fileRef = ref(storage, imageLink);
      await deleteObject(fileRef);
    }

    // Step 2: Delete the summary from MongoDB
    await Summary.findByIdAndDelete(summary_id);

    // Step 3: Delete associated save records
    await SaveSummary.deleteMany({ summaryId: summary_id });

    return res.status(200).json({ message: "Summary deleted successfully" });
  } catch (error: any) {
    console.log('From delete summary');
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
};






//************ Get class summary list *************** */
export const get_class_summary_list = async (req: any, res: Response) => {
  const { class_id } = req.params;
  const { id } = req.user;
  const { page = 1, limit = 10 } = req.query;
  console.log(class_id)
  console.log(page)
  try {
    let query: any = { classId: class_id };

    if (!class_id) {
      // Step 1: find class
      const findAccount = await Account.findOne({ _id: id });
      if (!findAccount) return res.status(404).send({ message: 'Class not found' });

      // Find saved summaries
      const savedSummary = await SaveSummary.find({ savedByAccountId: id });

      // Create an array with _id values
      // const summaryIdArray = savedSummary.map(summary => summary.summaryId);
      // console.log(summaryIdArray);
      const summaryIdArray = savedSummary.map((summary: any) => summary.summaryId);


      // Update the query to include the saved summaries
      query = { _id: { $in: summaryIdArray } };
    } else {
      const classInstance = await Class.findOne({ _id: class_id });
      if (!classInstance) return res.status(404).json({ message: 'Class not found' });
    }

    const count = await Summary.countDocuments(query);
    const summaries = await Summary.find(query, { __v: 0 })
      .populate({
        path: 'ownerId',
        select: 'name username image'
      })
      .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
      .skip((page - 1) * limit)
      .limit(limit);

    if (!summaries) {
      return res.status(404).json({ message: 'Not found' });
    }



    return res.status(200).json({
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalCount: count,
      message: 'All the summaries',
      summaries: summaries,

    });
  } catch (error: any) {
    return res.status(400).json({ message: error });
  }
};




//************ update  summary list *************** */



export const update_summary = async (req: any, res: Response) => {
  const { summary_id } = req.params;

  try {
    // find the class that contains the summary
    const classInstance = await Class.findOne({ 'summary._id': summary_id });
    if (!classInstance) return res.status(404).json({ message: 'Summary not found' });

    // find the routine that contains the class and check if the current user has permission to edit
    const routineInstance = await Routine.findOne({ _id: classInstance.rutin_id });
    if (!routineInstance) return res.status(404).json({ message: 'Routine not found' });
    if (req.user.id.toString() !== routineInstance.ownerid.toString())
      return res.status(401).json({ message: 'You do not have permission to edit a summary' });

    // update the summary and send response
    const summary = classInstance.summary.id(summary_id);
    summary.text = req.body.text;
    await classInstance.save();
    return res.status(200).send(classInstance);
  } catch (error: any) {
    return res.status(400).send(error.message);
  }
};

//************* SUMMARY STATUS ********************/
export const sunnary_status = async (req: any, res: Response) => {
  try {
    const { summary_id } = req.params;
    const { id } = req.user;

    console.log("sunnary_id");
    console.log(summary_id);


    let summaryOwner = false;
    let isOwner = false;
    let isCaptain = false;
    let isSummarySaved = false;

    // Find the Summary to check user status
    const foundSummary = await Summary.findById(summary_id);
    if (!foundSummary) {
      return res.status(500).json({ message: 'Summary Not Found' });
    }

    // Update summary owner status
    console.log('owener')

    console.log(foundSummary.ownerId)
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
//**************** save unsave summary***************** */
export const saveUnsaveSummary = async (req: any, res: Response) => {
  try {
    const { id: userId } = req.user;
    const { save, summaryId } = req.body;

    // Find the summary by ID
    const foundSummary = await Summary.findById(summaryId);
    if (!foundSummary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    const query = {
      summaryId,
      routineId: foundSummary.routineId,
      savedByAccountId: userId,
      classId: foundSummary.classId,


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
          savedSummary
        });

      case 'false':
        // Find the saved summary by summary ID and user ID
        const ifsvaed = await SaveSummary.findOne(query);
        if (!ifsvaed) {
          return res.status(404).json({ message: 'Saved summary not found' });
        }

        // Remove the saved summary
        await SaveSummary.findOneAndDelete(query);

        return res.status(200).json({
          message: 'Summary unsaved successfully',
          save: false,
        });

      default:
        return res.status(400).json({ message: 'Save condition is required' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
