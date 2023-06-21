const express = require('express')
const app = express()
const Account = require('../models/Account')
const Routine = require('../models/rutin_models')
const Class = require('../models/class_model');
const Summary = require('../models/summaryModels');
const RoutineMember = require('../models/rutineMembersModel')
const SaveSummary = require('../models/save_summary,mode')




//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_stroage = require("../config/firebase_stroges");
initializeApp(firebase_stroage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();

//************   create summary        *************** *//
exports.create_summary = async (req, res) => {
  const { message } = req.body;
  const { class_id } = req.params;
  const { id } = req.user;
  console.log(req.body);
  //console.log(req.files);

  try {
    // Step 1: find class
    const findClass = await Class.findOne({ _id: class_id });
    if (!findClass) return res.status(404).send({ message: 'Class not found' });

    // Step 2: generate unique file names
    const newImageFileNames = [];
    const timestamp = Date.now();

    for (let i = 0; i < req.files.length; i++) {
      const filename = `${timestamp}-${i}-${req.files[i].originalname}`;
      newImageFileNames.push(filename);

      // Step 3: upload file with new name and metadata
      const fileRef = ref(storage, `summary/classID-${class_id}/files/${filename}`);
      const metadata = { contentType: req.files[i].mimetype };
      await uploadBytes(fileRef, req.files[i].buffer, metadata);
    }

    // Step 4: get download URLs for the uploaded files
    const downloadUrls = [];
    for (let i = 0; i < newImageFileNames.length; i++) {
      const fileRef = ref(storage, `summary/classID-${class_id}/files/${newImageFileNames[i]}`);
      try {
        const url = await getDownloadURL(fileRef);
        downloadUrls.push(url);
      } catch (error) {
        console.log(error);
        downloadUrls.push('');
      }
    }
    // Step 5: create instance
    const summary = new Summary({
      ownerId: id,
      text: message,
      imageLinks: newImageFileNames,
      routineId: findClass.rutin_id,
      classId: findClass.id,
    });

    // Step 6: save and send response
    const createdSummary = await summary.save();
    console.log(createdSummary);
    console.log(id);
    return res.status(201).json({
      message: 'Summary created successfully',
      summary: createdSummary,
      downloadUrls,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Remove Summary
exports.remove_summary = async (req, res) => {
  const { summary_id } = req.params;
  const { id } = req.user;
  console.log('request for delte summary')
  console.log(req.body)
  try {
    let isCaptain = false;

    // Find the summary to be removed
    const findSummary = await Summary.findOne({ id: summary_id });
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
    const deletePermission = findSummary.ownerId !== id || routine.ownerid == id || isCaptain;
    if (!deletePermission) {
      return res.status(403).json({ message: "You don't have permission to delete" });
    }

    // delete from save

    const deleteTheSAve = await SaveSummary.deleteMany({ summaryId: summary_id })
    const class_id = findSummary.classId;
    // Delete files from Firebase Storage
    for (let i = 0; i < findSummary.imageLinks.length; i++) {
      const fileRef = ref(storage, `summary/classID-${class_id}/files/${findSummary.imageLinks[i]}`);
      await deleteObject(fileRef);
    }
    // Delete the summary from MongoDb
    const deleteed = await Summary.findByIdAndDelete(summary_id);

    return res.status(200).json({ message: "Summary deleted successfully", deleteed, deleteTheSAve });
  } catch (error) {
    console.log('From delte dummary')

    console.log(error)
    return res.status(400).json({ message: error.message });
  }
};







//************ Get class summary list *************** */
const getSummaryPDFUrls = async (summary, class_id) => {
  const urls = [];
  const storage = getStorage();

  for (let i = 0; i < summary.imageLinks.length; i++) {
    const imageRef = ref(storage, `summary/classID-${class_id}/files/${summary.imageLinks[i]}`);
    const url = await getDownloadURL(imageRef);
    urls.push(url);
  }

  return urls;
};

exports.get_class_summary_list = async (req, res) => {
  const { class_id } = req.params;
  const { id } = req.user;
  const { page = 1, limit = 10 } = req.query;
  console.log(class_id)
  console.log(page)
  try {
    let query = { classId: class_id };

    if (!class_id) {
      // Step 1: find class
      const findAccount = await Account.findOne({ _id: id });
      if (!findAccount) return res.status(404).send({ message: 'Class not found' });

      // Find saved summaries
      const savedSummary = await SaveSummary.find({ savedByAccountId: id });

      // Create an array with _id values
      const summaryIdArray = savedSummary.map(summary => summary.summaryId);
      console.log(summaryIdArray);

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

    const summarysWithUrls = await Promise.all(
      summaries.map(async (summary) => {
        const pdfUrls = await getSummaryPDFUrls(summary, summary.classId);
        return { ...summary.toObject(), imageUrls: pdfUrls };
      })
    );

    return res.status(200).json({
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalCount: count,
      message: 'All the summaries',
      summaries: summarysWithUrls,

    });
  } catch (error) {
    return res.status(400).json({ message: error });
  }
};



// exports.get_class_summary_list = async (req, res) => {
//   const { class_id } = req.params;

//   try {
//     //... find class
//     const classInstance = await Class.findOne({ _id: class_id });
//     if (!classInstance) return res.status(404).json({ message: 'Class not found' });

//     //.. send response with summary list
//     const summarys = await Summary.find({ classId :class_id });

//     return res.status(200).json({ message: "All the summarys" , summarys });

//   } catch (error) {
//     return res.status(400).json({ message: error });
//   }
// };

//************ update  summary list *************** */



exports.update_summary = async (req, res) => {
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
  } catch (error) {
    return res.status(400).send(error.message);
  }
};


//.... get last updated summay....//
exports.get_last_updated_summary = async (req, res) => {


  try {





  } catch (error) {

  }



}


//************* SUMMARY STATUS ********************/



exports.sunnary_status = async (req, res) => {
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
  } catch (error) {
    console.log(error);

    return res.status(500).json({ message: error.message });
  }
};
//**************** save unsave summary***************** */
exports.saveUnsaveSummary = async (req, res) => {
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
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
