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
const priode_Models_1 = __importDefault(require("../models/priode.Models"));
// routine firebase and helper
const summary_firebase_1 = require("../firebase/summary.firebase");
const class_helper_1 = require("../helper/class.helper");
const validation_error_1 = require("../../../utils/validation_error");
//************   create class       *************** */
const create_class = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const { routineID } = req.params;
    const { name, subjectcode, instuctor_name } = req.body;
    const { start_time, end_time, room } = req.body;
    const { routineID, weekday, start, end } = req.validateClassBookingAndPeremption;
    try {
        // create and save new class
        const newClass = new class_model_1.default({
            name,
            subjectcode,
            rutin_id: routineID,
            instuctor_name
        });
        yield newClass.save();
        // create and save new weekday
        const newWeekday = new weakday_Model_1.default({
            class_id: newClass._id,
            routine_id: routineID,
            num: weekday,
            start,
            room,
            end,
            start_time,
            end_time
        });
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
//,, Add weekday to class
const addWeekday = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Come after middleware
    const { classID } = req.params;
    const { num, room, start, end } = req.body;
    console.log(req.body);
    try {
        //
        const classFind = yield class_model_1.default.findById(classID);
        if (!classFind)
            return res.status(404).send({ message: 'Class not found' });
        // create and save new weekday
        const newWeekday = new weakday_Model_1.default({
            class_id: classID,
            routine_id: classFind.rutin_id.toString(),
            num,
            room: room,
            start,
            end
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
//************   edit_class       *************** */
const edit_class = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("from edit");
    console.log(req.body);
    const { class_id } = req.params;
    const { name, room, subjectcode, start, end, weekday, start_time, end_time } = req.body;
    try {
        // 1 chack class
        const classs = yield class_model_1.default.findOne({ _id: class_id });
        if (!classs)
            return res.status(404).send({ message: 'Class not found' });
        /// 2 chack rutin
        const rutin = yield routine_models_1.default.findOne({ _id: classs.rutin_id });
        if (!rutin)
            return res.status(404).send({ message: 'Routine not found' });
        // Check permission: owner or captain
        const routineMember = yield routineMembers_Model_1.default.findOne({ RutineID: classs.rutin_id, memberID: req.user.id });
        if (!routineMember || (!routineMember.owner && !routineMember.captain)) {
            return res.status(401).json({ message: "Only captains and owners can update classes" });
        }
        // 2  chack booking
        // const isAllradyBooking = await Class.findOne({ weekday, start, rutin_id: rutin._id });
        // if (isAllradyBooking) return res.status(404).send({ message: 'This week day and start time is already booked' });
        // const isAllradyBookingEnd = await Class.findOne({ weekday, end, rutin_id: rutin._id });
        // if (isAllradyBookingEnd) return res.status(404).send({ message: 'This week day and end time is already booked' });
        // 5 update 
        const updatedClass = yield class_model_1.default.findOneAndUpdate({ _id: class_id, rutin_id: classs.rutin_id }, { name, room, subjectcode, start, end, weekday, start_time, end_time }, { new: true });
        if (!updatedClass)
            return res.status(404).send({ message: 'Class not found' });
        console.log(updatedClass);
        res.send({ class: updatedClass, message: 'Class updated successfully' });
    }
    catch (error) {
        console.log(error);
        if (!(0, validation_error_1.handleValidationError)(res, error))
            return res.status(500).send({ message: error.message });
    }
});
exports.edit_class = edit_class;
//************ delete_class ***************
const delete_class = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { class_id } = req.params;
    console.log('request to delete class');
    try {
        // Step: 1 check Permeation 
        const classs = yield class_model_1.default.findById(class_id);
        if (!classs)
            return res.status(404).send({ message: 'Class not found' });
        // Check if routine exists
        const routine = yield routine_models_1.default.findById(classs.rutin_id);
        if (!routine)
            return res.status(404).send({ message: 'Routine not found' });
        // Check permission
        if (routine.ownerid.toString() !== req.user.id)
            return res.status(401).send({ message: 'You can only delete classes from your own routine' });
        // step 2 : delete 
        yield (0, summary_firebase_1.deleteSummariesFromFirebaseBaseOnClassId)(class_id);
        yield weakday_Model_1.default.deleteMany({ class_id: class_id });
        // Delete the class
        yield class_model_1.default.findByIdAndDelete(class_id);
        // step 3: Send response
        // console.log({ message: 'Class deleted successfully' })
        res.send({ message: 'Class deleted successfully' });
    }
    catch (error) {
        res.status(500).send({ message: error.message });
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
        // find period 
        const priodes = yield priode_Models_1.default.find({ rutin_id: routineID });
        //.. Get class By Weakday
        const allDayWithNull = yield weakday_Model_1.default.find({ routine_id: routineID }).populate('class_id');
        const allDay = allDayWithNull.filter((weekday) => weekday.class_id !== null);
        // with null class id valu 
        const SundayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 0 }).populate('class_id');
        const MondayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 1 }).populate('class_id');
        const TuesdayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 2 }).populate('class_id');
        const WednesdayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 3 }).populate('class_id');
        const ThursdayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 4 }).populate('class_id');
        const FridayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 5 }).populate('class_id');
        const SaturdayClassWithNull = yield weakday_Model_1.default.find({ routine_id: routineID, num: 6 }).populate('class_id');
        // with out null valu
        // without null value
        const SundayClass = SundayClassWithNull.filter((weekday) => weekday.class_id !== null);
        const MondayClass = MondayClassWithNull.filter((weekday) => weekday.class_id !== null);
        const TuesdayClass = TuesdayClassWithNull.filter((weekday) => weekday.class_id !== null);
        const WednesdayClass = WednesdayClassWithNull.filter((weekday) => weekday.class_id !== null);
        const ThursdayClass = ThursdayClassWithNull.filter((weekday) => weekday.class_id !== null);
        const FridayClass = FridayClassWithNull.filter((weekday) => weekday.class_id !== null);
        const SaturdayClass = SaturdayClassWithNull.filter((weekday) => weekday.class_id !== null);
        // addd start time and end time with it 
        const allClass = yield (0, class_helper_1.getClasses)(allDay, priodes);
        const Sunday = yield (0, class_helper_1.getClasses)(SundayClass, priodes);
        const Monday = yield (0, class_helper_1.getClasses)(MondayClass, priodes);
        const Tuesday = yield (0, class_helper_1.getClasses)(TuesdayClass, priodes);
        const Wednesday = yield (0, class_helper_1.getClasses)(WednesdayClass, priodes);
        const Thursday = yield (0, class_helper_1.getClasses)(ThursdayClass, priodes);
        const Friday = yield (0, class_helper_1.getClasses)(FridayClass, priodes);
        const Saturday = yield (0, class_helper_1.getClasses)(SaturdayClass, priodes);
        //
        const uniqClass = yield class_model_1.default.find({ rutin_id: routineID });
        const owner = yield Account_Model_1.default.findOne({ _id: routine.ownerid }, { name: 1, ownerid: 1, image: 1, username: 1 });
        res.send({ _id: routine._id, rutin_name: routine.name, priodes, uniqClass: uniqClass, Classes: { allClass, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday }, owner });
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
//************ all class *************** */
const classNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    try {
        // find all the routines where notification is on
        const findRoutines = yield routineMembers_Model_1.default.find({ memberID: id });
        if (!findRoutines) {
            return res.status(404).send(findRoutines);
        }
        const filteredRoutineIds = [];
        findRoutines.forEach((routine) => {
            if (routine.RutineID) {
                filteredRoutineIds.push(routine.RutineID);
            }
        });
        const routines = yield routine_models_1.default.find({ _id: { $in: filteredRoutineIds } });
        if (!routines)
            return res.status(404).send({ message: 'Routines not found' });
        // Find priodes
        const priodes = yield priode_Models_1.default.find({ rutin_id: { $in: filteredRoutineIds } });
        console.log(priodes);
        // Get class by Weekday
        const allDayWithNull = yield weakday_Model_1.default.find({ routine_id: { $in: filteredRoutineIds } }).populate('class_id');
        const allDay = allDayWithNull.filter((weekday) => weekday.class_id !== null);
        // console.log({ allday: allDay });
        // add start time and end time with it 
        const allClass = yield (0, class_helper_1.getNotificationClasses)(allDay, priodes);
        const filteredClasses = allClass.filter((classItem) => classItem.start_time && classItem.end_time);
        // console.log({ notificationOnClasses: filteredClasses });
        res.send({ notificationOnClasses: filteredClasses });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server Error', notificationOnClasses: [] });
    }
});
exports.classNotification = classNotification;
