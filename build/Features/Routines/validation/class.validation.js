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
exports.classEditValidation = exports.validateClassBookingAndPeremption = exports.classValidation = void 0;
const routine_models_1 = __importDefault(require("../models/routine.models"));
const routineMembers_Model_1 = __importDefault(require("../models/routineMembers.Model"));
const weakday_Model_1 = __importDefault(require("../models/weakday.Model"));
const classValidation = (req, res, next) => {
    console.log(req.body);
    try {
        const { name, instuctor_name, subjectcode, room, weekday } = req.body;
        const { routineID } = req.params;
        // Check if required fields are provided
        if (!name) {
            return res.status(400).send({ message: 'Validation failed: name is required' });
        }
        if (!instuctor_name) {
            return res.status(400).send({ message: 'Validation failed: instructor_name is required' });
        }
        if (!subjectcode) {
            return res.status(400).send({ message: 'Validation failed: subjectcode is required' });
        }
        if (!weekday) {
            return res.status(400).send({ message: 'Validation failed: weekday is required' });
        }
        if (!room) {
            return res.status(400).send({ message: 'Validation failed: room number is required' });
        }
        if (!routineID) {
            return res.status(400).send({ message: 'Validation failed: routineID is required' });
        }
        // If all validations pass, proceed to the next middleware/controller
        next();
    }
    catch (error) {
        // Handle any errors that occur during validation
        res.status(500).send({ message: 'Internal server error' });
    }
};
exports.classValidation = classValidation;
const validateClassBookingAndPeremption = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { weekday, start, end } = req.body;
    const { routineID } = req.params;
    const userID = req.user.id;
    try {
        // Find Routine to check the owner
        const findRoutine = yield routine_models_1.default.findOne({ _id: routineID });
        if (!findRoutine)
            return res.status(401).json({ message: "Routine not found" });
        // Check permission: owner or captain
        const routineMember = yield routineMembers_Model_1.default.findOne({ RutineID: routineID, memberID: userID });
        if (!routineMember || (!routineMember.owner && !routineMember.captain)) {
            return res.status(401).json({ message: "Only captains and owners can add classes" });
        }
        // Validation 2: Check for booking
        // const startPriodeAlreadyBooked = await Weekday.findOne({ routine_id: routineID, num: weekday, start });
        // if (startPriodeAlreadyBooked) return res.status(404).send({ message: 'Start priode is already booked' });
        // const endPriodeAlreadyBooked = await Weekday.findOne({ routine_id: routineID, num: weekday, end });
        // if (endPriodeAlreadyBooked) return res.status(404).send({ message: 'End priode is already booked' });
        // Find all the start and end priode in the given num
        const allStart = yield weakday_Model_1.default.find({ routine_id: routineID, num: weekday }, { start: 1 });
        const allEnd = yield weakday_Model_1.default.find({ routine_id: routineID, num: weekday }, { end: 1 });
        //
        req.validateClassBookingAndPeremption = { routineID, weekday, start, end };
        // If all validations pass, proceed to the next middleware or route handler
        next();
    }
    catch (error) {
        return res.status(500).send({ message: 'Internal Server Error' });
    }
});
exports.validateClassBookingAndPeremption = validateClassBookingAndPeremption;
// class edit validation
const classEditValidation = (req, res, next) => {
    console.log(req.body);
    try {
        const { name, instuctor_name, subjectcode, room, weekday } = req.body;
        const { routineID } = req.params;
        // Check if required fields are provided
        if (!name) {
            return res.status(400).send({ message: 'Validation failed: name is required' });
        }
        if (!instuctor_name) {
            return res.status(400).send({ message: 'Validation failed: instructor_name is required' });
        }
        if (!subjectcode) {
            return res.status(400).send({ message: 'Validation failed: subjectcode is required' });
        }
        next();
    }
    catch (error) {
        // Handle any errors that occur during validation
        res.status(500).send({ message: 'Internal server error' });
    }
};
exports.classEditValidation = classEditValidation;
