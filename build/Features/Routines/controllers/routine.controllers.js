"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeFeed = exports.routine_details = exports.joined_routine = exports.current_user_status = exports.save_routines = exports.save_and_unsave_routine = exports.search_routine = exports.deleteRoutine = exports.createRoutine = void 0;
// Models
const Account_Model_1 = __importDefault(require("../../Account/models/Account.Model"));
const routine_models_1 = __importDefault(require("../models/routine.models"));
const routineMembers_Model_1 = __importDefault(require("../models/routineMembers.Model"));
const class_model_1 = __importDefault(require("../models/class.model"));
const weakday_Model_1 = __importDefault(require("../models/weakday.Model"));
const save_routine_model_1 = __importDefault(require("../models/save_routine.model"));
//! firebase
const app_1 = require("firebase/app");
const storage_1 = require("firebase/storage");
const firebase_storage = require("../../../config/firebase/firebase_storage");
(0, app_1.initializeApp)(firebase_storage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = (0, storage_1.getStorage)();
// routine firebase
const summary_firebase_1 = require("../firebase/summary.firebase");
const mongodb_connection_1 = require("../../../connection/mongodb.connection");
//*******************************************************************************/
//--------------------------------- createRoutine  ------------------------------/
//*******************************************************************************/
const createRoutine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongodb_connection_1.RoutineDB.startSession();
    session.startTransaction();
    try {
        const { name } = req.body;
        const ownerId = req.user.id;
        console.log('creating routine');
        // Check if a routine with the same name and owner already exists
        const existingRoutine = yield routine_models_1.default.findOne({ name, ownerid: ownerId }).session(session);
        if (existingRoutine) {
            yield session.abortTransaction();
            return res.status(400).json({ message: 'Routine already created with this name' });
        }
        // Check routine count
        console.log(' Check routine count');
        const routineCount = yield routine_models_1.default.countDocuments({ ownerid: ownerId }).session(session);
        if (routineCount >= 20) {
            yield session.abortTransaction();
            return res.status(400).json({ message: 'You can only create up to 20 routines' });
        }
        console.log(' Step 1: Create a new routine object');
        // Step 1: Create a new routine object
        const routine = new routine_models_1.default({ name, ownerid: ownerId });
        console.log(' Step 2: Create a new RoutineMember instance');
        // Step 2: Create a new RoutineMember instance
        const routineMember = new routineMembers_Model_1.default({ RutineID: routine._id, memberID: ownerId, owner: true });
        console.log(' Step 3: Save the routine object to the database');
        // Step 3: Save the routine object to the database
        const createdRoutine = yield routine.save({ session });
        console.log('step 4 update routine');
        // Step 4: Update the user's routines array with the new routine ID
        const updatedUser = yield Account_Model_1.default.findOneAndUpdate({ _id: ownerId }, { $push: { routines: createdRoutine._id } }, { new: true });
        console.log(' Step 5');
        // Step 5: Wait for the routineMember instance to be saved
        yield routineMember.save({ session });
        console.log(' Step 6');
        // Step 6: Commit the transaction
        yield session.commitTransaction();
        console.log(' Step 7');
        // Step 7: Send a success response with the new routine and updated user object
        res.status(200).json({ message: 'Routine created successfully', routine: createdRoutine, user: updatedUser, routineMember });
    }
    catch (error) {
        // Handle errors and abortTransaction
        console.error('Error creating routine:', error);
        // Rollback the transaction
        yield session.abortTransaction();
        res.status(500).json({ message: 'Routine creation failed', error });
    }
    finally {
        yield session.endSession();
    }
});
exports.createRoutine = createRoutine;
//*******************************************************************************/
//--------------------------------- deleteRoutine  ------------------------------/
//*******************************************************************************/
const deleteRoutine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const requestUserID = req.user.id;
    const session = yield mongodb_connection_1.maineDB.startSession();
    session.startTransaction();
    try {
        // Delete summaries from MongoDB and Firebase
        yield (0, summary_firebase_1.deleteSummariesFromFirebaseBaseOnRoutineID)(id);
        // Delete the classes and save their IDs
        const findClassesWhichShouldBeDeleted = yield class_model_1.default.find({ rutin_id: id });
        const deletedClassIDList = findClassesWhichShouldBeDeleted.map((item) => item._id);
        // Saving the deleted classes
        for (let i = 0; i < deletedClassIDList.length; i++) {
            const classId = deletedClassIDList[i];
            // Delete the class
            yield class_model_1.default.findByIdAndDelete(findClassesWhichShouldBeDeleted[i].id, { session });
        }
        yield weakday_Model_1.default.deleteMany({ routine_id: id }, { session });
        yield routineMembers_Model_1.default.deleteMany({ RutineID: id }, { session });
        yield save_routine_model_1.default.deleteMany({ routineID: id }, { session });
        // Pull out the routine ID from the owner's routines array
        yield Account_Model_1.default.updateOne({ _id: requestUserID }, { $pull: { routines: id } }, { session });
        // Delete the routine
        yield routine_models_1.default.findByIdAndDelete(id, { session });
        // Commit the transaction
        yield session.commitTransaction();
        res.status(200).json({ message: 'Routine deleted successfully' });
    }
    catch (error) {
        // Handle errors and abortTransition
        console.error(error);
        // Rollback the transaction
        yield session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'Error deleting routine', error });
    }
    finally {
        yield session.endSession();
    }
});
exports.deleteRoutine = deleteRoutine;
//*******************************************************************************/
//--------------------------------- search Routine  ------------------------------/
//*******************************************************************************/
const search_routine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { src } = req.query; // get the value of 'src' from the query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    try {
        const regex = new RegExp(src, "i"); // Adjust the regex pattern for case-insensitive matching
        const count = yield routine_models_1.default.countDocuments({
            $or: [
                { name: regex },
                // Add more fields to search here
            ]
        });
        const routines = yield routine_models_1.default.find({
            $or: [
                { name: regex },
                {
                    ownerid: { $in: yield Account_Model_1.default.find({ $or: [{ name: regex }, { username: regex }] }, "_id") }
                },
                // Add more fields to search here
            ]
        })
            .select("_id name ownerid")
            .populate({
            path: "ownerid",
            model: Account_Model_1.default,
            select: "_id name username image"
        })
            .limit(limit)
            .skip((page - 1) * limit);
        if (!routines)
            return res.status(404).send({ message: "Not found" });
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
    }
    catch (error) {
        res.send({ message: error.message });
    }
});
exports.search_routine = search_routine;
//***************************************************************************************/
//--------------------Save and unsave  Routine  &  show save routine --------------------/
//**************************************************************************************/
const save_and_unsave_routine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineId } = req.params;
    const { saveCondition } = req.body;
    const { id } = req.user;
    console.log(routineId);
    try {
        // Find the user
        const user = yield Account_Model_1.default.findById(id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        // Find the routine
        const routine = yield routine_models_1.default.findById(routineId);
        if (!routine)
            return res.status(404).json({ message: "Routine not found" });
        // Find the save routine entry
        const alreadySaveRoutine = yield save_routine_model_1.default.findOne({ routineID: routineId, savedByAccountID: id });
        let message, save;
        // Handle saveCondition
        if (saveCondition === "true") {
            // Check if routine is already saved
            if (alreadySaveRoutine) {
                message = "Routine already saved";
                save = true;
            }
            else {
                // Create a new SaveRoutine document
                const saveRoutine = new save_routine_model_1.default({ routineID: routineId, savedByAccountID: id });
                yield saveRoutine.save();
                message = "Routine saved successfully";
                save = true;
            }
        }
        else if (saveCondition === "false") {
            if (!alreadySaveRoutine) {
                return res.status(400).json({ message: "Routine not saved" });
            }
            // Remove the save routine entry
            yield save_routine_model_1.default.findOneAndDelete({ routineID: routineId, savedByAccountID: id });
            message = "Routine unsaved successfully";
            save = false;
        }
        else {
            return res.status(400).json({ message: "Invalid saveCondition" });
        }
        // Send response
        console.log({ message, save });
        res.status(200).json({ message, save });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error saving routine" });
    }
});
exports.save_and_unsave_routine = save_and_unsave_routine;
//.......save routines.../
const save_routines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    try {
        // Find the account by primary username
        const account = yield Account_Model_1.default.findById(id);
        if (!account)
            return res.status(404).json({ message: "Account not found" });
        // Find the saved routines for the account and populate owner details
        const savedRoutines = yield save_routine_model_1.default.find({ savedByAccountID: id })
            .populate({
            path: 'routineID',
            select: 'name ownerid',
            populate: {
                path: 'ownerid',
                model: Account_Model_1.default,
                select: 'name username image'
            }
        })
            .limit(limit)
            .skip((page - 1) * limit);
        // Count the total number of saved routines
        const count = yield save_routine_model_1.default.countDocuments({ savedByAccountID: id });
        // Prepare response data
        const response = {
            savedRoutines: savedRoutines.map((routine) => routine.routineID),
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        };
        res.status(200).json(response);
        // console.log(response);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.save_routines = save_routines;
//**************  current_user_status     *********** */
const current_user_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { routineId } = req.params;
        const { id } = req.user;
        console.log(req.user.id);
        console.log('Checking user status');
        // const findAccount = await Account.findOne({ username });
        const routine = yield routine_models_1.default.findOne({ _id: routineId });
        if (!routine)
            return res.status(404).json({ message: "Routine not found" });
        const memberCount = routine.members.length;
        let isOwner = false;
        let isCaptain = false;
        let activeStatus = "not_joined";
        let isSaved = false;
        let notificationOn = false;
        //
        const findAccount = yield Account_Model_1.default.findById(id);
        const findOnSaveRoutine = yield save_routine_model_1.default.findOne({ routineID: routineId, savedByAccountID: id });
        if (findOnSaveRoutine) {
            isSaved = true;
        }
        //
        const alreadyMember = yield routineMembers_Model_1.default.findOne({ RutineID: routineId, memberID: id });
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error });
    }
});
exports.current_user_status = current_user_status;
///.... joined Routine ......///
const joined_routine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1;
    try {
        const count = yield routine_models_1.default.countDocuments({ members: id });
        const routines = yield routine_models_1.default.find({ members: id })
            .select(" name ownerid")
            .populate({
            path: 'ownerid',
            model: Account_Model_1.default,
            select: 'name image username'
        })
            .skip((page - 1) * limit)
            .limit(limit);
        if (!routines)
            return res.status(404).json({ message: "No joined routines found" });
        res.status(200).json({
            routines,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving joined routines" });
    }
});
exports.joined_routine = joined_routine;
//**************  uploaded_rutins     *********** */
const routine_details = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const routine = yield routine_models_1.default.findOne({ _id: rutin_id });
        if (!routine)
            return res.json({ message: "Routine not found" });
        // Get the member count
        const memberCount = routine.members.length;
        // Get the count of sent member requests
        const sentRequests = routine.send_request;
        sentRequestCount = sentRequests.length;
        // Check if the user has saved the routine
        const findAccount = yield Account_Model_1.default.findOne({ username });
        if (!findAccount)
            return res.status(200).json({ isOwner, isCapten, activeStatus, memberCount, sentRequestCount });
        if (findAccount.Saved_routines.includes(rutin_id)) {
            isSave = true;
        }
        // Check if the user is the owner
        if (routine.ownerid.toString() === req.user.id) {
            isOwner = true;
        }
        // Check if the user is a captain
        if (routine.cap10s.includes(req.user.id)) {
            isCapten = true;
        }
        // Check if the user is an active member
        const alreadyMember = routine.members.includes(req.user.id);
        if (alreadyMember) {
            activeStatus = "joined";
        }
        // Check if the user has a pending request
        const pendingRequest = routine.send_request.includes(req.user.id);
        if (pendingRequest) {
            activeStatus = "request_pending";
        }
        //..........also demo ..... rutin name id owner id image and member,,,
        // Find the routine and its members 
        const routines = yield routine_models_1.default.findOne({ _id: rutin_id }, { members: 1 })
            .populate({
            path: 'members',
            model: Account_Model_1.default,
            select: 'name username image',
            options: {
                sort: { createdAt: -1 },
            },
        });
        if (!routine)
            return res.json({ message: "Routine not found" });
        const members = routines === null || routines === void 0 ? void 0 : routines.members;
        //res.json({ message: "All Members", count, members });
        res.status(200).json({ current_userstatus: { isOwner, isCapten, activeStatus, isSave, memberCount, sentRequestCount }, members, });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.routine_details = routine_details;
//************** user can see all routines where owner or joined ***********
const homeFeed = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const routines = yield routineMembers_Model_1.default.find(query, '-_id -__v')
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
        const nullRutineIDIds = routines
            .filter((routine) => routine.RutineID === null || routine.RutineID === undefined || routine.RutineID === '')
            .map((routine) => routine._id);
        //  console.log(nullRutineIDIds);
        // Remove the objects with null RutineID from MongoDB
        yield routineMembers_Model_1.default.deleteMany({ _id: { $in: nullRutineIDIds } });
        // Filter out the objects with null RutineID from the response
        //const filteredRoutines = routines.filter(routine => routine.RutineID !== null);
        const filteredRoutines = routines.filter((routine) => routine.RutineID);
        // Get the total count of matching routines
        const totalCount = yield routineMembers_Model_1.default.countDocuments(query);
        if (page == 1 && !userID) {
            const updated = yield Account_Model_1.default.findByIdAndUpdate(req.user.id, { osUserID: osUserID }, { new: true });
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.homeFeed = homeFeed;
