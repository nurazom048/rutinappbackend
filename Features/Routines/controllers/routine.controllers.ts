import express, { Request, Response } from 'express';

// Models
import Account from '../../Account/models/Account.Model';
import Routine from '../models/routine.models';
import RoutineMember from '../models/routineMembers.Model';
import Summary from '../models/save_summary.model';
import SaveSummaries from '../models/save_summary.model';
import Classes from '../models/class.model';
import Weekday from '../models/weakday.Model';
import SaveRoutine from '../models/save_routine.model';
import Class from '../models/class.model';

//! firebase
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
const firebase_storage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_storage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();


// routine firebase
import { deleteSummariesFromFirebaseBaseOnRoutineID } from '../firebase/summary.firebase';
import { getClasses } from '../helper/class.helper';
import mongoose from 'mongoose';
import { maineDB, RoutineDB } from '../../../connection/mongodb.connection';


//*******************************************************************************/
//--------------------------------- createRoutine  ------------------------------/
//*******************************************************************************/
export const createRoutine = async (req: any, res: Response) => {
  const session = await RoutineDB.startSession();
  session.startTransaction();

  try {
    const { name } = req.body;
    const ownerId = req.user.id;
    console.log('creating routine');

    // Check if a routine with the same name and owner already exists
    const existingRoutine = await Routine.findOne({ name, ownerid: ownerId }).session(session);
    if (existingRoutine) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Routine already created with this name' });
    }

    // Check routine count
    console.log(' Check routine count');
    const routineCount = await Routine.countDocuments({ ownerid: ownerId }).session(session);
    if (routineCount >= 20) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'You can only create up to 20 routines' });
    }
    console.log(' Step 1: Create a new routine object');

    // Step 1: Create a new routine object
    const routine = new Routine({ name, ownerid: ownerId });
    console.log(' Step 2: Create a new RoutineMember instance');

    // Step 2: Create a new RoutineMember instance
    const routineMember = new RoutineMember({ RutineID: routine._id, memberID: ownerId, owner: true });
    console.log(' Step 3: Save the routine object to the database');

    // Step 3: Save the routine object to the database
    const createdRoutine = await routine.save({ session });
    console.log('step 4 update routine');

    // Step 4: Update the user's routines array with the new routine ID
    const updatedUser = await Account.findOneAndUpdate(
      { _id: ownerId },
      { $push: { routines: createdRoutine._id } },
      { new: true }
    )
    console.log(' Step 5');

    // Step 5: Wait for the routineMember instance to be saved
    await routineMember.save({ session });
    console.log(' Step 6');

    // Step 6: Commit the transaction
    await session.commitTransaction();
    console.log(' Step 7');

    // Step 7: Send a success response with the new routine and updated user object
    res.status(200).json({ message: 'Routine created successfully', routine: createdRoutine, user: updatedUser, routineMember });
  } catch (error) {
    // Handle errors and abortTransaction
    console.error('Error creating routine:', error);

    // Rollback the transaction
    await session.abortTransaction();
    res.status(500).json({ message: 'Routine creation failed', error });
  } finally {
    await session.endSession();
  }
};

//*******************************************************************************/
//--------------------------------- deleteRoutine  ------------------------------/
//*******************************************************************************/

export const deleteRoutine = async (req: any, res: Response) => {
  const { id } = req.params;
  const requestUserID = req.user.id;


  const session = await maineDB.startSession();
  session.startTransaction();

  try {
    // Delete summaries from MongoDB and Firebase
    await deleteSummariesFromFirebaseBaseOnRoutineID(id);

    // Delete the classes and save their IDs
    const findClassesWhichShouldBeDeleted = await Classes.find({ rutin_id: id });
    const deletedClassIDList = findClassesWhichShouldBeDeleted.map((item: any) => item._id);

    // Saving the deleted classes
    for (let i = 0; i < deletedClassIDList.length; i++) {
      const classId = deletedClassIDList[i];
      // Delete the class
      await Classes.findByIdAndDelete(findClassesWhichShouldBeDeleted[i].id, { session });
    }

    await Weekday.deleteMany({ routine_id: id }, { session });
    await RoutineMember.deleteMany({ RutineID: id }, { session });
    await SaveRoutine.deleteMany({ routineID: id }, { session });
    // Pull out the routine ID from the owner's routines array
    await Account.updateOne({ _id: requestUserID }, { $pull: { routines: id } }, { session });
    // Delete the routine
    await Routine.findByIdAndDelete(id, { session });

    // Commit the transaction
    await session.commitTransaction();

    res.status(200).json({ message: 'Routine deleted successfully' });
  } catch (error: any) {
    // Handle errors and abortTransition
    console.error(error);

    // Rollback the transaction
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: 'Error deleting routine', error });
  } finally {
    await session.endSession();
  }
};
//*******************************************************************************/
//--------------------------------- search Routine  ------------------------------/
//*******************************************************************************/

export const search_routine = async (req: any, res: Response) => {
  const { src } = req.query; // get the value of 'src' from the query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const regex = new RegExp(src, "i"); // Adjust the regex pattern for case-insensitive matching
    const count = await Routine.countDocuments({
      $or: [
        { name: regex },
        // Add more fields to search here
      ]
    });
    const routines = await Routine.find({
      $or: [
        { name: regex },
        {
          ownerid: { $in: await Account.find({ $or: [{ name: regex }, { username: regex }] }, "_id") }
        },
        // Add more fields to search here
      ]
    })
      .select("_id name ownerid")
      .populate({
        path: "ownerid",
        model: Account,
        select: "_id name username image"
      })
      .limit(limit)
      .skip((page - 1) * limit);

    if (!routines) return res.status(404).send({ message: "Not found" });
    console.log({
      routines,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalCount: count
    });

    res.status(200).json({
      routines,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalCount: count
    });
  } catch (error: any) {
    res.send({ message: error.message });
  }
};


//***************************************************************************************/
//--------------------Save and unsave  Routine  &  show save routine --------------------/
//**************************************************************************************/

export const save_and_unsave_routine = async (req: any, res: Response) => {
  const { routineId } = req.params;
  const { saveCondition } = req.body;
  const { id } = req.user;
  console.log(routineId);

  try {
    // Find the user
    const user = await Account.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find the routine
    const routine = await Routine.findById(routineId);
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    // Find the save routine entry
    const alreadySaveRoutine = await SaveRoutine.findOne({ routineID: routineId, savedByAccountID: id });

    let message, save;

    // Handle saveCondition
    if (saveCondition === "true") {
      // Check if routine is already saved
      if (alreadySaveRoutine) {
        message = "Routine already saved";
        save = true;
      } else {
        // Create a new SaveRoutine document
        const saveRoutine = new SaveRoutine({ routineID: routineId, savedByAccountID: id });
        await saveRoutine.save();
        message = "Routine saved successfully";
        save = true;
      }
    } else if (saveCondition === "false") {
      if (!alreadySaveRoutine) {
        return res.status(400).json({ message: "Routine not saved" });
      }

      // Remove the save routine entry
      await SaveRoutine.findOneAndDelete({ routineID: routineId, savedByAccountID: id });

      message = "Routine unsaved successfully";
      save = false;
    } else {
      return res.status(400).json({ message: "Invalid saveCondition" });
    }

    // Send response
    console.log({ message, save });
    res.status(200).json({ message, save });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error saving routine" });
  }
};


//.......save routines.../
export const save_routines = async (req: any, res: Response) => {
  const { id } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;

  try {
    // Find the account by primary username
    const account = await Account.findById(id);
    if (!account) return res.status(404).json({ message: "Account not found" });

    // Find the saved routines for the account and populate owner details
    const savedRoutines = await SaveRoutine.find({ savedByAccountID: id })
      .populate({
        path: 'routineID',
        select: 'name ownerid',
        populate: {
          path: 'ownerid',
          model: Account,

          select: 'name username image'
        }
      })
      .limit(limit)
      .skip((page - 1) * limit);

    // Count the total number of saved routines
    const count = await SaveRoutine.countDocuments({ savedByAccountID: id });

    // Prepare response data
    const response = {
      savedRoutines: savedRoutines.map((routine: any) => routine.routineID),
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    };

    res.status(200).json(response);
    // console.log(response);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};




//**************  current_user_status     *********** */
export const current_user_status = async (req: any, res: Response) => {
  try {

    const { routineId } = req.params;
    const { id } = req.user;
    console.log(req.user.id)

    console.log('Checking user status');
    // const findAccount = await Account.findOne({ username });
    const routine = await Routine.findOne({ _id: routineId });
    if (!routine) return res.status(404).json({ message: "Routine not found" });


    const memberCount = routine.members.length;

    let isOwner = false;
    let isCaptain = false;
    let activeStatus = "not_joined";
    let isSaved = false;
    let notificationOn = false;

    //
    const findAccount = await Account.findById(id);
    const findOnSaveRoutine = await SaveRoutine.findOne({ routineID: routineId, savedByAccountID: id })
    if (findOnSaveRoutine) {
      isSaved = true;
    }
    //
    const alreadyMember = await RoutineMember.findOne({ RutineID: routineId, memberID: id });
    if (alreadyMember) {
      activeStatus = "joined";
      isOwner = alreadyMember.owner;
      isCaptain = alreadyMember.captain;
      notificationOn = alreadyMember.notificationOn;

    }

    const pendingRequest = routine.send_request.includes(req.user.id);
    if (pendingRequest) {
      activeStatus = "request_pending";
    }

    console.log({
      isOwner,
      isCaptain,
      activeStatus,
      isSaved,
      memberCount,
      notificationOn
    });
    res.status(200).json({
      isOwner,
      isCaptain,
      activeStatus,
      isSaved,
      memberCount,
      notificationOn
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};



///.... joined Routine ......///
export const joined_routine = async (req: any, res: Response) => {
  const { id } = req.user;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1;

  try {
    const count = await Routine.countDocuments({ members: id });

    const routines = await Routine.find({ members: id })
      .select(" name ownerid")
      .populate({
        path: 'ownerid',
        model: Account,
        select: 'name image username'
      })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!routines) return res.status(404).json({ message: "No joined routines found" });

    res.status(200).json({
      routines,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving joined routines" });
  }
};

//**************  uploaded_rutins     *********** */
export const routine_details = async (req: any, res: Response) => {
  const { rutin_id } = req.params;
  const { username } = req.user;

  //
  let isOwner = false;
  let isCapten = false;
  let activeStatus = "not_joined";
  let isSave = false;
  let sentRequestCount = 0;

  try {


    // Find the routine to check user status
    const routine = await Routine.findOne({ _id: rutin_id });
    if (!routine) return res.json({ message: "Routine not found" });

    // Get the member count
    const memberCount = routine.members.length;

    // Get the count of sent member requests
    const sentRequests = routine.send_request;
    sentRequestCount = sentRequests.length;

    // Check if the user has saved the routine
    const findAccount = await Account.findOne({ username });
    if (!findAccount) return res.status(200).json({ isOwner, isCapten, activeStatus, memberCount, sentRequestCount });
    if (findAccount.Saved_routines.includes(rutin_id)) { isSave = true; }

    // Check if the user is the owner
    if (routine.ownerid.toString() === req.user.id) { isOwner = true }

    // Check if the user is a captain
    if (routine.cap10s.includes(req.user.id)) { isCapten = true }

    // Check if the user is an active member
    const alreadyMember = routine.members.includes(req.user.id);
    if (alreadyMember) { activeStatus = "joined" }

    // Check if the user has a pending request
    const pendingRequest = routine.send_request.includes(req.user.id);
    if (pendingRequest) { activeStatus = "request_pending"; }



    //..........also demo ..... rutin name id owner id image and member,,,

    // Find the routine and its members 
    const routines = await Routine.findOne({ _id: rutin_id }, { members: 1 })
      .populate({
        path: 'members',
        model: Account,
        select: 'name username image',
        options: {
          sort: { createdAt: -1 },
        },
      });
    if (!routine) return res.json({ message: "Routine not found" });

    const members = routines?.members;


    //res.json({ message: "All Members", count, members });

    res.status(200).json({ current_userstatus: { isOwner, isCapten, activeStatus, isSave, memberCount, sentRequestCount }, members, })
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};



//************** user can see all routines where owner or joined ***********
export const homeFeed = async (req: any, res: Response) => {
  const { id } = req.user;
  const { userID } = req.params;
  const { osUserID } = req.body;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;

  try {
    // Find routines where the user is the owner or a member and Routine ID exists and is not null
    let query;

    if (userID) {
      // This query is for to find all the uploaded routine on a specific user
      query = { memberID: userID, owner: true };
    }
    // This query is for to find all the home routine of logged in user 
    query = { memberID: userID || id };
    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;
    // console.log(query);
    // console.log(userID);

    // Find all matching routines
    const routines = await RoutineMember.find(query, '-_id -__v')
      .populate({
        path: 'RutineID',
        select: 'name'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    //  console.log(routines);

    // Get the IDs of routines with null RutineID
    // const nullRutineIDIds = routines 
    //   .filter(routine => routine.RutineID === null || routine.RutineID === undefined || routine.RutineID === '')
    //   .map(routine => routine._id);
    const nullRutineIDIds: string[] = routines
      .filter((routine: any) => routine.RutineID === null || routine.RutineID === undefined || routine.RutineID === '')
      .map((routine: any) => routine._id);
    //  console.log(nullRutineIDIds);

    // Remove the objects with null RutineID from MongoDB
    await RoutineMember.deleteMany({ _id: { $in: nullRutineIDIds } });

    // Filter out the objects with null RutineID from the response
    //const filteredRoutines = routines.filter(routine => routine.RutineID !== null);
    const filteredRoutines: any[] = routines.filter((routine: any) => routine.RutineID);

    // Get the total count of matching routines
    const totalCount = await RoutineMember.countDocuments(query);

    if (page == 1 && !userID) {
      const updated = await Account.findByIdAndUpdate(req.user.id, { osUserID: osUserID }, { new: true });
      // console.log(updated)
    }
    // console.log({
    //   message: 'success',
    //   homeRoutines: filteredRoutines,
    //   currentPage: page,
    //   totalPages: Math.ceil(totalCount / limit),
    //   totalItems: totalCount,
    // })
    res.status(200).json({
      message: 'success',
      homeRoutines: filteredRoutines,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
