const express = require('express')
const app = express()
const Account = require('../models/Account')
const Routine = require('../models/rutin_models')
const Class = require('../models/class_model');
const Summary = require('../models/summaryModels');





//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const firebase_stroage = require("../config/firebase_stroges");
initializeApp(firebase_stroage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();

//************   create summary        *************** *//
exports.create_summary = async (req, res) => {
  const { message } = req.body;
  const { class_id } = req.params;
  const { id } = req.user;
  //console.log(req.body);
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
      const fileRef = ref(storage, `summary/files/${filename}`);
      const metadata = { contentType: req.files[i].mimetype };
      await uploadBytes(fileRef, req.files[i].buffer, metadata);
    }

    // Step 4: get download URLs for the uploaded files
    const downloadUrls = [];
    for (let i = 0; i < newImageFileNames.length; i++) {
      const fileRef = ref(storage, `summary/files/${newImageFileNames[i]}`);
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
//console.log(createdSummary);
    return res.status(201).json({
      message: 'Summary created successfully',
      summary: createdSummary,
      downloadUrls,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


//************ remove summary *************** */

exports.remove_summary = async (req, res) => {
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


    //.. remove the summary and send response
    classInstance.summary.pull({ _id: summary_id });
    await classInstance.save();
    return res.status(200).send(classInstance);
    ///
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

//************ Get class summary list *************** */
//************ Get class summary list *************** */
const getSummaryPDFUrls = async (summary) => {
  const urls = [];
  const storage = getStorage();

  for (let i = 0; i < summary.imageLinks.length; i++) {
    const imageRef = ref(storage, `summary/files/${summary.imageLinks[i]}`);
    const url = await getDownloadURL(imageRef);
    urls.push(url);
  }

  return urls;
};

exports.get_class_summary_list = async (req, res) => {
  const { class_id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const classInstance = await Class.findOne({ _id: class_id });
    if (!classInstance) return res.status(404).json({ message: 'Class not found' });

    const count = await Summary.countDocuments({ classId: class_id });
    const summaries = await Summary.find({ classId: class_id }, { __v: 0 })
      .populate({
        path: 'ownerId',
        select: 'name username image'
      })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!summaries) {
      return res.status(404).json({ message: 'Not found' });
    }

    const summarysWithUrls = await Promise.all(
      summaries.map(async (summary) => {
        const pdfUrls = await getSummaryPDFUrls(summary);
        return { ...summary.toObject(), imageUrls: pdfUrls };
      })
    );

    return res.status(200).json({
      message: 'All the summaries',
      summaries: summarysWithUrls,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalCount: count
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