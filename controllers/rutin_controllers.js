const Account = require('../models/Account')
const Routine = require('../models/rutin_models')
const RoutineMember = require('../models/rutineMembersModel')
const Summary = require('../models/summaryModels')
const SaveSummarys = require('../models/save_summary,mode')
const Priode = require('../models/priodeModels')
const Classes = require('../models/class_model')
const DeletedClass = require('../models/deleted/deleted_routines')
const { getClasses } = require('../methode/get_class_methode');
const Weekday = require('../models/weakdayModel');

const Class = require('../models/class_model');

//

//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_stroage = require("../config/firebase_stroges");
initializeApp(firebase_stroage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();


// routine firebse
const { deleteSummariesFromFirebase } = require('../controllers/Routines/routines.frebase');


const getRoutineData = async (rutin_id) => {
  try {
    const routine = await Routine.findOne({ _id: rutin_id });
    if (!routine) throw new Error("Routine not found");

    const priodes = await Priode.find({ rutin_id: rutin_id });

    const SundayClass = await Weekday.find({ rutin_id, num: 0 }).populate('class_id');
    const MondayClass = await Weekday.find({ rutin_id, num: 1 }).populate('class_id');
    const TuesdayClass = await Weekday.find({ rutin_id, num: 2 }).populate('class_id');
    const WednesdayClass = await Weekday.find({ rutin_id, num: 3 }).populate('class_id');
    const ThursdayClass = await Weekday.find({ rutin_id, num: 4 }).populate('class_id');
    const FridayClass = await Weekday.find({ rutin_id, num: 5 }).populate('class_id');
    const SaturdayClass = await Weekday.find({ rutin_id, num: 6 }).populate('class_id');

    const Sunday = await getClasses(SundayClass, priodes);
    const Monday = await getClasses(MondayClass, priodes);
    const Tuesday = await getClasses(TuesdayClass, priodes);
    const Wednesday = await getClasses(WednesdayClass, priodes);
    const Thursday = await getClasses(ThursdayClass, priodes);
    const Friday = await getClasses(FridayClass, priodes);
    const Saturday = await getClasses(SaturdayClass, priodes);

    const owner = await Account.findOne({ _id: routine.ownerid }, { name: 1, ownerid: 1, image: 1, username: 1 });

    return { _id: routine._id, rutin_name: routine.name, priodes, Classes: { Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday }, owner };
  } catch (error) {
    throw error;
  }
};





//********** createRutin   ************* */
exports.createRutin = async (req, res) => {
  const { name } = req.body;
  console.log(req.body);

  // Log the user who is creating the routine
  console.log(req.user);

  const ownerId = req.user.id;

  try {
    // Check if a routine with the given name already exists for the user
    const existingRoutine = await Routine.findOne({ name, ownerid: ownerId });
    if (existingRoutine) return res.status(500).send({ message: "Routine already created with this name" });

    // Create a new routine object
    const routine = new Routine({ name, ownerid: ownerId });
    const routineMember = new RoutineMember({ RutineID: routine._id, memberID: ownerId, owner: true }); // Create a new RoutineMember instance

    // Save the routine object to the database
    const createdRoutine = await routine.save();

    // Update the user's routines array with the new routine ID
    const updatedUser = await Account.findOneAndUpdate(
      { _id: ownerId },
      { $push: { routines: createdRoutine._id } },
      { new: true }
    );

    await routineMember.save(); // Wait for the routineMember instance to be saved

    // Send a success response with the new routine and updated user object
    res.status(200).json({ message: "Routine created successfully", routine: createdRoutine, user: updatedUser, routineMember });
  } catch (error) {
    console.error(error);
    // Handle the error and send an appropriate response
    res.status(500).json({ message: "Failed to create routine", error: error.message });
  }
};



//*******   deleteRoutine   ***** */

exports.deleteRoutine = async (req, res) => {
  const { id } = req.params;

  try {

    await SaveSummarys.deleteMany({ routineId: id });

    // Delete summaries from MongoDB and firebse
    const summariesToDelete = await Summary.find({ routineId: id });
    await deleteSummariesFromFirebase(summariesToDelete);

    // // Delete the classes and save their IDs
    // const findClassesWhichShouldBeDeleted = await Classes.find({ rutin_id: id });
    // const deletedClassIDList = findClassesWhichShouldBeDeleted.map((item) => item._id);

    // // Saving the deleted classes
    // for (let i = 0; i < deletedClassIDList.length; i++) {
    //   const classId = deletedClassIDList[i];
    //   const deletedClass = new DeletedClass({ classId });
    //   await deletedClass.save();
    //   // Delete the class
    //   await Classes.findByIdAndRemove(findClassesWhichShouldBeDeleted[i].id);
    // }

    // await Weekday.deleteMany({ routine_id: id });
    // await Priode.deleteMany({ rutin_id: id });
    // await RoutineMember.deleteMany({ RutineID: id });

    // // Delete the routine
    // await Routine.findByIdAndRemove(id);

    res.status(200).json({ message: "Routine deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting routine" });
  }
};

//*******      allRutin   ***** */

exports.allRutin = async (req, res) => {
  console.log(req.user);

  const userid = req.user.id;

  try {


    const user = await Account.findOne({ _id: userid }).populate([
      {
        path: 'routines',
        select: 'name ownerid class priode last_summary',
        options: {
          sort: { createdAt: -1 }
        },

        populate: {
          path: 'ownerid',
          select: 'name username image'
        }
      },
      {
        path: 'Saved_routines',
        select: 'name ownerid class',
        options: {
          sort: { createdAt: -1 }
        },
        populate: {
          path: 'ownerid',
          select: 'name username image'
        }
      }
    ]);
    if (!user) return res.status(404).json({ message: "User not found" });



    res.status(200).json({ user, });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting routines" });
  }
};


//********** save rutin   ************* */
exports.add_to_save_routine = async (req, res) => {
  const { rutin_id } = req.params;
  const ownerid = req.user.id;
  const { saveCondition } = req.body; console.log(req.body);

  try {
    // 1. Find the routine
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });
    const user = await Account.findById(ownerid);
    if (!user) return res.status(404).json({ message: "User not found" });

    let message, save;
    // 2. Find the user
    if (saveCondition == "true") {

      // 3. Check if routine is already saved
      if (user.Saved_routines.includes(routine._id)) {
        message = "Routine already saved";
        save = true;
      } else {
        // 4. Push the routine ID into the saved_routines array
        user.Saved_routines.push(routine._id);
        await user.save();
        message = "Routine saved successfully";
        save = true;
      }
    }

    if (saveCondition == "false") {
      if (!user.Saved_routines.includes(routine._id)) {
        return res.status(400).json({ message: "Routine not saved" });
      }
      // 4. Remove the routine ID from the saved_routines array
      user.Saved_routines.pull(routine._id);
      await user.save();
      message = "Routine unsaved successfully";
      save = false;
    }

    // Send response
    res.status(200).json({ message: message, save: save });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving routine" });
  }
};









//.... unsave rutin 
exports.unsave_routine = async (req, res) => {
  const { rutin_id } = req.params;
  const ownerid = req.user.id;

  try {
    // 1. Find the routine
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });


    // 2. Find the user
    const user = await Account.findById(ownerid);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 3. Check if routine is already saved
    if (!user.Saved_routines.includes(routine._id)) {
      return res.status(400).json({ message: "Routine not saved" });
    }

    // 4. Remove the routine ID from the saved_routines array
    user.Saved_routines.pull(routine._id);
    await user.save();

    // Send response
    res.status(200).json({ message: "Routine unsaved successfully", save: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error unsaving routine" });
  }
};


///.... chack save or not
exports.save_checkout = async (req, res) => {
  const { rutin_id } = req.params;
  const ownerid = req.user.id;

  try {
    // 1. Find the routine
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });


    // 2. Find the user
    const user = await Account.findOne({ ownerid });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 3. Check if routine is already saved
    let isSaved;
    isOwner = false;
    if (user.Saved_routines.includes(routine._id)) {
      isSaved = true;
    }

    if (!user.Saved_routines.includes(routine._id)) {
      isSaved = false;

    }

    // chack is owner is not
    if (routine.ownerid.toString() == req.user.id) { isOwner = true; };




    // Send response
    res.status(200).json({ message: "Routine saved conditon", save: isSaved, isOwner, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving routine" });
  }
};





//********** Search rutins    ************* */

exports.search_rutins = async (req, res) => {
  const { src } = req.query; // get the value of 'src' from the query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;

  try {
    const regex = new RegExp(src, "i");
    const count = await Routine.countDocuments({ name: regex });
    const routine = await Routine.find({ name: regex })
      .select("_id name ownerid")
      .populate({
        path: "ownerid",
        select: "_id name username image"
      })
      .limit(limit)
      .skip((page - 1) * limit);

    if (!routine) return res.status(404).send({ message: "Not found" });


    res.status(200).json({
      routine,
      // Sunday,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.send({ message: error.message });
  }
};




//.......  /save_rutins.../
exports.save_rutins = async (req, res) => {
  const { username } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;

  try {
    // Find the account by primary username
    const account = await Account.findOne({ username: username || req.user.username });
    if (!account) return res.status(404).json({ message: "Account not found" });

    // Find the saved routines for the account and populate owner details
    const savedRoutines = await Routine.find({ _id: { $in: account.Saved_routines } })
      .select("_id name ownerid")
      .populate({ path: "ownerid", select: "name username image" })
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Routine.countDocuments({ _id: { $in: account.Saved_routines } });


    res.status(200).json({
      savedRoutines,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.send({ message: error.message });
  }
};





//**************  uploaded_rutins     *********** */
exports.uploaded_rutins = async (req, res) => {
  const { username } = req.params;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;

  try {
    const findAccount = await Account.findOne({ username: username || req.user.username })
    if (!findAccount) return res.status(404).json({ message: "Account not found" });

    const count = await Routine.countDocuments({ ownerid: findAccount._id });

    const rutins = await Routine.find({ ownerid: findAccount._id })
      .select("name ownerid")
      .populate({ path: 'ownerid', select: 'name image username' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!rutins) return res.status(404).json({ message: "rutins not found" });

    res.status(200).json({
      rutins,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });

  } catch (error) {
    res.send({ message: error.message });
  }
}

//**************  current_user_status     *********** */
exports.current_user_status = async (req, res) => {
  const { rutin_id } = req.params;
  const { username } = req.user;

  //
  let isOwner = false;
  let isCapten = false;
  let activeStatus = "not_joined";
  let isSave = false;
  let notificationOff = true;
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
    if (findAccount.Saved_routines.includes(rutin_id)) {
      isSave = true;
    }

    // Check if the user is the owner

    const isowener = await RoutineMember.findOne({ memberID: req.user.id, RutineID: rutin_id, owner: true })
    if (isowener) {
      isOwner = true;
    }

    // Check if the user is a captain
    const isCaptenFind = await RoutineMember.findOne({ memberID: req.user.id, RutineID: rutin_id, captain: true })
    if (isCaptenFind) { isCapten = true; }



    // Check if the user is an active member
    const alreadyMember = await RoutineMember.findOne({ memberID: req.user.id, RutineID: rutin_id, });
    if (alreadyMember) { activeStatus = "joined"; }

    // Check if the user has a pending request
    const pendingRequest = routine.send_request.includes(req.user.id);
    if (pendingRequest) {
      activeStatus = "request_pending";
    }

    // Check notification status
    const isNotificationOffFound = await RoutineMember.findOne({ memberID: req.user.id, RutineID: rutin_id, notificationOn: false });
    if (!isNotificationOffFound) { notificationOff = false; }

    res.status(200).json({
      isOwner,
      isCapten,
      activeStatus,
      isSave,
      memberCount,
      sentRequestCount,
      notificationOff,
    });
  } catch (error) {
    res.send({ message: error.message });
  }
};


///.... joined rutins ......///
exports.joined_rutins = async (req, res) => {
  const { id } = req.user;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1;

  try {
    const count = await Routine.countDocuments({ members: id });

    const routines = await Routine.find({ members: id })
      .select(" name ownerid")
      .populate({ path: 'ownerid', select: 'name image username' })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!routines) return res.status(404).json({ message: "No joined routines found" });

    res.status(200).json({
      routines,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving joined routines" });
  }
};

//**************  uploaded_rutins     *********** */
exports.rutinDetails = async (req, res) => {
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



    //..........also demd ..... rutin name id owener id image and member,,,

    // Find the routine and its members 
    const routines = await Routine.findOne({ _id: rutin_id }, { members: 1 })
      .populate({
        path: 'members',
        select: 'name username image',
        options: {
          sort: { createdAt: -1 },
        },
      });
    if (!routine) return res.json({ message: "Routine not found" });

    const members = routines.members;


    //res.json({ message: "All Members", count, members });

    res.status(200).json({ current_userstatus: { isOwner, isCapten, activeStatus, isSave, memberCount, sentRequestCount }, members, })
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// exports.homeFeed = async (req, res) => {
//   const { id } = req.user;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 3;
//   console.log(req.user);
//   try {
//     // Find routines where the user is the owner or a member
//     const query = { members: id };

//     // Calculate the number of documents to skip
//     const skip = (page - 1) * limit;

//     // Aggregate to eliminate duplicate routines based on RutineID
//     const uniqueRoutines = await RoutineMember.aggregate(query)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     // Get the total count of matching routines
//     const totalCount = await RoutineMember.countDocuments(query);

//     res.status(200).json({
//       message: 'success',
//       homeRoutines: uniqueRoutines,
//       currentPage: page,
//       totalPages: Math.ceil(totalCount / limit),
//       totalItems: totalCount
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
//************** user can see all routines where owner or joined ***********
exports.homeFeed = async (req, res) => {
  const { id } = req.user;
  const { userID } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;
  console.log(req.user);
  try {
    // Find routines where the user is the owner or a member and Routine ID exists and is not null
    let query = { memberID: userID || id };

    if (userID) {
      query = { memberID: userID, owner: true };
    }

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Find all matching routines
    const routines = await RoutineMember.find(query, '-_id -__v')
      .populate({
        path: 'RutineID',
        select: 'name'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(routines);

    // Get the IDs of routines with null RutineID
    const nullRutineIDIds = routines
      .filter(routine => routine.RutineID === null || routine.RutineID === undefined || routine.RutineID === '')
      .map(routine => routine._id);
    console.log(nullRutineIDIds);

    // Remove the objects with null RutineID from MongoDB
    await RoutineMember.deleteMany({ _id: { $in: nullRutineIDIds } });

    // Filter out the objects with null RutineID from the response
    const filteredRoutines = routines.filter(routine => routine.RutineID !== null);

    // Get the total count of matching routines
    const totalCount = await RoutineMember.countDocuments(query);

    res.status(200).json({
      message: 'success',
      homeRoutines: filteredRoutines,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
