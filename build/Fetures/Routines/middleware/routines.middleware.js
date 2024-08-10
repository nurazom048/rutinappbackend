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
exports.Peremption_To_delete_Routine = exports.validateWeekdayMiddleware = void 0;
// imports models
const class_model_1 = __importDefault(require("../models/class.model"));
const routine_models_1 = __importDefault(require("../models/routine.models"));
const weakday_Model_1 = __importDefault(require("../models/weakday.Model"));
// WEEKDAY validation
const validateWeekdayMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { classID } = req.params;
    const { num, start, end } = req.body;
    try {
        // Check required fields
        if (!num) {
            return res.status(400).send({ message: 'Weekday number is required' });
        }
        if (!start) {
            return res.status(400).send({ message: 'Start period is required' });
        }
        if (!end) {
            return res.status(400).send({ message: 'End period is required' });
        }
        // Check from database
        const classFind = yield class_model_1.default.findById(classID);
        if (!classFind) {
            return res.status(404).send({ message: 'Class not found' });
        }
        const routine = yield routine_models_1.default.findOne({ _id: classFind.routine_id });
        if (!routine) {
            return res.status(404).send({ message: 'Routine not found' });
        }
        // Period not created validations
        // const findEnd = await PriodeModel.findOne({ rutin_id: classFind.rutin_id, priode_number: start });
        // const findStartPriod = await PriodeModel.findOne({ rutin_id: classFind.rutin_id, priode_number: end });
        // if (!findEnd) {
        //   return res.status(404).send({ message: `${end} period is not created` });
        // }
        // if (!findStartPriod) {
        //   return res.status(404).send({ message: `${start} period is not created` });
        // }
        // Validation to check booking
        const startPriodeAlreadyBooked = yield weakday_Model_1.default.findOne({ routine_id: classFind.routine_id, num, start });
        if (startPriodeAlreadyBooked) {
            return res.status(404).send({ message: 'Start period is already booked' });
        }
        const endPriodeAlreadyBooked = yield weakday_Model_1.default.findOne({ routine_id: classFind.routine_id, num, end });
        if (endPriodeAlreadyBooked) {
            return res.status(404).send({ message: 'End period is already booked' });
        }
        // // Check if any period is already booked within the range
        // const mid: number[] = [];
        // const allStart = await Weekday.find({ num });
        // const allEnd = await Weekday.find({ num }, { end: 1 });
        // for (let i = 0; i < allStart.length; i++) {
        //   for (let j = allStart[i].start + 1; j < allEnd[i].end; j++) {
        //     mid.push(j);
        //   }
        // }
        // if (mid.includes(start)) {
        //   return res.status(400).send({ message: `${start} This period is already booked. All bookings up to ${mid}` });
        // }
        // if (mid.includes(end)) {
        //   return res.status(400).send({ message: `This ${end} period is already booked. All bookings up to ${mid}` });
        // }
        req.classFind = classFind;
        req.routine = routine;
        next();
    }
    catch (error) {
        return res.status(500).send({ message: error.message });
    }
});
exports.validateWeekdayMiddleware = validateWeekdayMiddleware;
//
// Peremption To delete Routine
const Peremption_To_delete_Routine = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const requestUserID = req.user.id;
    try {
        const routine = yield routine_models_1.default.findById(id);
        if (!routine)
            return res.status(404).json({ message: "Routine not found" });
        if (routine.ownerid.toString() !== requestUserID) {
            return res.status(401).json({ message: "Unauthorized to delete routine" });
        }
        next();
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
});
exports.Peremption_To_delete_Routine = Peremption_To_delete_Routine;
