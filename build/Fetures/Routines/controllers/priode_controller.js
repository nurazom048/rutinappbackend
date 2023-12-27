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
exports.find_priode_by_id = exports.all_priode = exports.edit_priode = exports.delete_priode = exports.add_priode = void 0;
// Models
const priode_Models_1 = __importDefault(require("../models/priode.Models"));
// Helper
const priode_helper_1 = require("../helper/priode.helper");
const routine_models_1 = __importDefault(require("../models/routine.models"));
const weakday_Model_1 = __importDefault(require("../models/weakday.Model"));
const validation_error_1 = require("../../../utils/validation_error");
//************  add Priode *************** */
const add_priode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { start_time, end_time } = req.body;
    const { routineID } = req.params;
    try {
        console.log(routineID);
        // Check if the routine exists
        const existingRoutine = yield routine_models_1.default.findById(routineID);
        if (!existingRoutine)
            return res.status(404).send({ message: 'Routine not found' });
        // Count the number of existing prides for the routine
        const priodeCount = yield priode_Models_1.default.countDocuments({ rutin_id: routineID });
        // console.log(priodeCount)
        // Create a new priode instance with the next priode number
        const priode = new priode_Models_1.default({
            priode_number: !priodeCount || priodeCount === 0 ? 1 : priodeCount + 1,
            start_time,
            end_time,
            rutin_id: routineID,
        });
        // console.log(priode)
        // Save the priode to the database
        const added = yield priode.save();
        res.status(200).send({ message: 'Priode added to routine', added });
    }
    catch (error) {
        console.log(error);
        if (!(0, validation_error_1.handleValidationError)(res, error)) {
            return res.status(500).send({ message: error.message });
        }
    }
});
exports.add_priode = add_priode;
//************  delete Priode *************** */
const delete_priode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { priode_id } = req.params;
    try {
        // Find the priode to be deleted and its associated routine
        const priode = yield priode_Models_1.default.findById(priode_id);
        if (!priode) {
            return res.status(404).send({ message: 'Priode not found' });
        }
        // console.log(priode);
        // Check if the priode is being used in a weekday
        const weekdayUsing = yield weakday_Model_1.default.findOne({
            routine_id: priode.rutin_id,
            $or: [
                { start: { $in: [priode.priode_number] } },
                { end: { $in: [priode.priode_number] } },
            ],
        });
        if (weekdayUsing) {
            return res.status(400).send({ message: 'You cannot delete this period because it is now used on other classes' });
        }
        // Calculate the mid array
        const routineID = priode.rutin_id;
        const mid = yield (0, priode_helper_1.calculateMidArray)(routineID);
        // console.log(mid)
        // Check if priode.priode_number is within valid weekday numbers
        if (mid.includes(priode.priode_number)) {
            return res.status(400).send({ message: 'You cannot delete this period because it is now used on other classes' });
        }
        // Delete the priode
        yield priode.deleteOne();
        // Update the priode numbers of the remaining priode in the routine
        const remainingPriode = yield priode_Models_1.default.find({ rutin_id: priode.rutin_id })
            .sort({ priode_number: 'asc' });
        let priodeNumber = 1;
        for (let i = 0; i < remainingPriode.length; i++) {
            const currPriode = remainingPriode[i];
            if (currPriode.priode_number !== priodeNumber) {
                currPriode.priode_number = priodeNumber;
                yield currPriode.save();
            }
            priodeNumber++;
        }
        res.status(200).send({ message: 'Priode deleted', deleted: priode });
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
exports.delete_priode = delete_priode;
//************  edit priode ***************** */
const edit_priode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { start_time, end_time } = req.body;
    const { rutin_id, priodeId } = req.params;
    try {
        // Find the priode to be edited
        const priode = yield priode_Models_1.default.findOne({ _id: priodeId });
        if (!priode)
            return res.status(404).send({ message: 'Priode not found', id: priodeId });
        // Update the priode start and end time
        priode.start_time = start_time;
        priode.end_time = end_time;
        // Save the updated priode to the database
        const updated = yield priode.save();
        res.status(200).send({ message: 'Priode updated', updated });
    }
    catch (error) {
        if (!(0, validation_error_1.handleValidationError)(res, error)) {
            return res.status(500).send({ message: error.message });
        }
    }
});
exports.edit_priode = edit_priode;
//************ all priode  *************** */
const all_priode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID } = req.params;
    // console.log(`rutin_id: ${routineID}`);
    try {
        const priode = yield priode_Models_1.default.find({ rutin_id: routineID });
        res.send({ message: 'All priode list', priodes: priode });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal server error' });
    }
});
exports.all_priode = all_priode;
//************ find priode by id  *************** */
const find_priode_by_id = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { priode_id } = req.params;
    try {
        // Find the priode by its id
        const priode = yield priode_Models_1.default.findById(priode_id);
        if (!priode)
            return res.status(404).send({ message: 'Priode not found' });
        res.status(200).send(priode);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
exports.find_priode_by_id = find_priode_by_id;
