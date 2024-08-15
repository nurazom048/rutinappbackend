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
exports.classNotification = exports.findclass = exports.allclass = exports.show_weekday_classes = exports.delete_class = exports.edit_class = exports.allWeekdayInClass = exports.deleteWeekdayById = exports.addWeekday = exports.create_class = void 0;
// Models
const routine_models_1 = __importDefault(require("../models/routine.models"));
const class_model_1 = __importDefault(require("../models/class.model"));
const weakday_Model_1 = __importDefault(require("../models/weakday.Model"));
const routineMembers_Model_1 = __importDefault(require("../models/routineMembers.Model"));
const Account_Model_1 = __importDefault(require("../../Account/models/Account.Model"));
const validation_error_1 = require("../../../utils/validation_error");
const utils_1 = require("../../../utils/utils");
const mongodb_connection_1 = require("../../../connection/mongodb.connection");
const save_summary_model_1 = __importDefault(require("../models/save_summary.model"));
const summary_models_1 = __importDefault(require("../models/summary.models"));
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
const create_class = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, subjectcode, instuctor_name } = req.body;
    const { start_time, end_time, room } = req.body;
    const { routineID, weekday } = req.validateClassBookingAndPeremption;
    try {
        // create and save new class
        const newClass = new class_model_1.default({
            name,
            subjectcode,
            routine_id: routineID,
            instuctor_name,
        });
        yield newClass.save();
        // create and save new weekday
        const newWeekday = new weakday_Model_1.default({
            class_id: newClass._id,
            routine_id: routineID,
            num: weekday,
            room,
            start_time,
            end_time,
        });
        (0, utils_1.printD)('weekday' + newWeekday);
        yield newWeekday.save();
        const updatedRoutine = yield routine_models_1.default.findOne({ _id: routineID });
        res.send({ _id: newClass.id, class: newClass, message: 'Class added successfully', routine: updatedRoutine, newWeekday });
        //
    }
    catch (error) {
        console.log({ message: error.message });
        if (!(0, validation_error_1.handleValidationError)(res, error))
            return res.status(500).send({ message: error.message });
    }
});
exports.create_class = create_class;
//*******************************************************************************/
//-------------------------------- -Add weekday to class ------------------------------/
//*******************************************************************************/
const addWeekday = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Come after middleware
    const { classID } = req.params;
    const { num, room, start_time, end_time, start_time_2, end_time_2 } = req.body;
    console.log(req.body);
    try {
        //
        const classFind = yield class_model_1.default.findById(classID);
        if (!classFind)
            return res.status(404).send({ message: 'Class not found' });
        // create and save new weekday
        const newWeekday = new weakday_Model_1.default({
            class_id: classID,
            routine_id: classFind.routine_id.toString(),
            num,
            room: room,
            start_time,
            end_time,
            start_time_2,
            end_time_2,
        });
        yield newWeekday.save();
        // add new weekday to the weekday array of the routine
        classFind.weekday.push(newWeekday._id);
        yield classFind.save();
        res.send({ message: 'Weekday added successfully', newWeekday });
    }
    catch (error) {
        if (!(0, validation_error_1.handleValidationError)(res, error)) {
            return res.status(500).send({ message: error.message });
        }
    }
});
exports.addWeekday = addWeekday;
//******* deleteWeekdayById ************** */
const deleteWeekdayById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, classID } = req.params;
    try {
        // Check if the class has at least 1 weekday
        const weekdaysCount = yield weakday_Model_1.default.countDocuments({ class_id: classID });
        if (weekdaysCount === 1) {
            return res.status(404).send({ message: 'Class must have at least 1 weekday, cannot delete it' });
        }
        // Find and delete the weekday
        const weekday = yield weakday_Model_1.default.findOneAndDelete({ _id: id });
        if (!weekday) {
            return res.status(404).send('Weekday not found');
        }
        // Find the remaining weekdays for the class
        const weekdays = yield weakday_Model_1.default.find({ class_id: classID });
        console.log({ message: 'Weekday deleted successfully', weekdays });
        res.send({ message: 'Weekday deleted successfully', weekdays });
    }
    catch (error) {
        res.status(500).send({ message: error.message, weekdays: [] });
    }
});
exports.deleteWeekdayById = deleteWeekdayById;
//******* show all weekday in a class ************** */
const allWeekdayInClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { class_id } = req.params;
    try {
        if (!class_id)
            return res.status(500).send({ message: "ClassId not found", weekdays: [] });
        // 1 weekdays
        const weekdays = yield weakday_Model_1.default.find({ class_id: class_id });
        res.send({ message: "All weekday in the class", weekdays });
    }
    catch (error) {
        console.log(error);
        return res.status(500).send({ message: error.toString, weekdays: [] });
    }
});
exports.allWeekdayInClass = allWeekdayInClass;
//*************************************************************************/
//-------------------------  edit_class   ---------------------------------/
//*************************************************************************/
const edit_class = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { class_id } = req.params;
    const { name, instuctor_name, subjectcode } = req.body;
    try {
        // Step 1: Check if class exists
        const classData = yield class_model_1.default.findById(class_id);
        if (!classData)
            return res.status(404).send({ message: 'Class not found' });
        // Step 2: Check if routine exists
        const routine = yield routine_models_1.default.findById(classData.routine_id);
        if (!routine)
            return res.status(404).send({ message: 'Routine not found' });
        // Step 3: Check permission: owner or captain
        const routineMember = yield routineMembers_Model_1.default.findOne({ RutineID: classData.routine_id, memberID: req.user.id });
        if (!routineMember || (!routineMember.captain && routine.ownerid.toString() !== req.user.id)) {
            return res.status(401).json({ message: 'Only captains and owners can update classes' });
        }
        // Step 4: Update the class
        const updatedClass = yield class_model_1.default.findByIdAndUpdate(class_id, { name, instuctor_name, subjectcode }, { new: true });
        if (!updatedClass)
            return res.status(404).send({ message: 'Class not found after update attempt' });
        // Step 5: Send success response
        res.send({ class: updatedClass, message: 'Class updated successfully' });
    }
    catch (error) {
        console.error('Error updating class:', error);
        res.status(500).send({ message: error.message });
    }
});
exports.edit_class = edit_class;
//**********************************************************************/
//-------------------- Delete Class ------------------------------------//
//**********************************************************************/
const delete_class = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { class_id } = req.params;
    const { id } = req.user;
    console.log('Request to delete class');
    const session = yield mongodb_connection_1.RoutineDB.startSession();
    session.startTransaction();
    try {
        // Step 1: Find the class
        const classData = yield class_model_1.default.findById(class_id);
        if (!classData)
            return res.status(404).send({ message: 'Class not found' });
        // Step 2: Check permission
        const routine = yield routine_models_1.default.findById(classData.routine_id);
        if (!routine)
            return res.status(404).send({ message: 'Routine not found' });
        // Check if the user is the routine owner or a captain/member
        const routineMember = yield routineMembers_Model_1.default.findOne({ RutineID: classData.routine_id, memberID: id });
        if (!routineMember || (!routineMember.captain && routine.ownerid.toString() !== id)) {
            return res.status(403).send({ message: "You don't have permission to delete this class" });
        }
        // Step 3: Delete associated save summaries
        yield save_summary_model_1.default.deleteMany({ classId: class_id }).session(session);
        // Step 4: Delete associated summaries
        const summaries = yield summary_models_1.default.find({ classId: class_id }).session(session);
        for (const summary of summaries) {
            // Delete summary files from Firebase storage
            for (const imageLink of (_a = summary.imageLinks) !== null && _a !== void 0 ? _a : []) {
                const fileRef = ref(storage, imageLink);
                yield deleteObject(fileRef);
            }
            // Delete the summary itself
            yield summary_models_1.default.findByIdAndDelete(summary._id).session(session);
        }
        // Step 5: Delete weekdays associated with the class
        yield weakday_Model_1.default.deleteMany({ class_id: class_id }).session(session);
        // Step 6: Delete the class
        yield class_model_1.default.findByIdAndDelete(class_id).session(session);
        yield session.commitTransaction();
        // Step 7: Send success response
        res.send({ message: 'Class deleted successfully' });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error('Error in delete_class:', error);
        res.status(500).send({ message: error.message });
    }
    finally {
        session.endSession();
    }
});
exports.delete_class = delete_class;
//************ show_weekday_classes *************** */
const show_weekday_classes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID, weekday } = req.params;
    console.log(weekday);
    try {
        const routine = yield routine_models_1.default.findById(routineID);
        if (!routine)
            return res.status(404).send('Routine not found');
        const classes = yield class_model_1.default.find({
            weekday: 1,
            rutin_id: routineID,
        }).sort({ start_time: 1 });
        res.send({ classes });
    }
    catch (error) {
        res.status(400).send({ error });
    }
});
exports.show_weekday_classes = show_weekday_classes;
//************ all class *************** */
const allclass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID } = req.params;
    try {
        const routine = yield routine_models_1.default.findById(routineID);
        if (!routine)
            return res.status(404).send('Routine not found');
        //.. Get class By Weekday
        // with null class id vale 
        const SundayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 0 }).populate('class_id');
        const MondayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 1 }).populate('class_id');
        const TuesdayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 2 }).populate('class_id');
        const WednesdayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 3 }).populate('class_id');
        const ThursdayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 4 }).populate('class_id');
        const FridayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 5 }).populate('class_id');
        const SaturdayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 6 }).populate('class_id');
        // without null value
        const Sunday = SundayClassWithNull.filter((weekday) => weekday.class_id !== null);
        const Monday = MondayClassWithNull.filter((weekday) => weekday.class_id !== null);
        const Tuesday = TuesdayClassWithNull.filter((weekday) => weekday.class_id !== null);
        const Wednesday = WednesdayClassWithNull.filter((weekday) => weekday.class_id !== null);
        const Thursday = ThursdayClassWithNull.filter((weekday) => weekday.class_id !== null);
        const Friday = FridayClassWithNull.filter((weekday) => weekday.class_id !== null);
        const Saturday = SaturdayClassWithNull.filter((weekday) => weekday.class_id !== null);
        //
        const uniqClass = yield class_model_1.default.find({ routine_id: routineID });
        const owner = yield Account_Model_1.default.findOne({ _id: routine.ownerid }, { name: 1, ownerid: 1, image: 1, username: 1 });
        res.send({ _id: routine._id, routine_name: routine.name, AllClass: uniqClass, Classes: { Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday }, owner });
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});
exports.allclass = allclass;
//************   edit_class       *************** */
const findclass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { class_id } = req.params;
    console.log(class_id);
    try {
        // 1 chack clases
        const classs = yield class_model_1.default.findOne({ _id: class_id }, { weekday: 0, summary: 0, _v: 0 });
        if (!classs)
            return res.status(404).send({ message: 'Class not found' });
        // 2 cweekdays
        const weekdays = yield weakday_Model_1.default.find({ class_id });
        res.status(200).send({ message: "All weekday in the class", classs, weekdays });
        //
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error updating class', weekdays: [] });
    }
});
exports.findclass = findclass;
//*********************************************************************** */
//------------------------- class Notification Time -----------------------//
//*********************************************************************** */
const classNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    try {
        // Step 1: Get all routine IDs where the user is a member
        const findRoutines = yield routineMembers_Model_1.default.find({ memberID: id });
        if (!findRoutines) {
            return res.status(404).send({ message: 'No routines found for the user' });
        }
        // Convert ObjectId to string and filter out null/undefined routine IDs
        const filteredRoutineIds = findRoutines
            .map(routine => { var _a; return (_a = routine.RutineID) === null || _a === void 0 ? void 0 : _a.toString(); })
            .filter(Boolean);
        // Step 2: Find weekdays associated with the routine IDs and populate class_id and routine_id
        const allDaysWithNull = yield weakday_Model_1.default.find({ routine_id: { $in: filteredRoutineIds } })
            .populate({
            path: 'class_id',
            select: '-weekday' // Exclude the 'weekday' field from the populated 'class_id' object
        });
        // Filter out weekdays that do not have a valid class_id
        const allDays = allDaysWithNull.filter(weekday => weekday.class_id !== null);
        // Step 3: Send response with the filtered weekdays
        res.send({ allClassForNotification: allDays });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server Error', notificationOnClasses: [] });
    }
});
exports.classNotification = classNotification;
