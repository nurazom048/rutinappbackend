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
exports.removeCaptain = exports.addCaptain = void 0;
const Account_Model_1 = __importDefault(require("../../Account/models/Account.Model"));
const routine_models_1 = __importDefault(require("../models/routine.models"));
const routineMembers_Model_1 = __importDefault(require("../models/routineMembers.Model"));
//************   addCaptain      *************** */
const addCaptain = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.body;
    const routineId = req.body.rutinid || req.body.routineID || req.body.routineId;
    try {
        const routine = yield routine_models_1.default.findOne({ _id: routineId });
        if (!routine)
            return res.json({ message: "Routine not found" });
        // Check if the logged-in user is the owner or captain
        const isHavePermission = yield routineMembers_Model_1.default.findOne({ RutineID: routineId, memberID: req.user.id });
        if (!isHavePermission || (isHavePermission.captain === false && isHavePermission.owner === false)) {
            return res.json({ message: "Only the owner and captain can modify" });
        }
        const captainAccount = yield Account_Model_1.default.findOne({ username: username });
        if (!captainAccount)
            return res.json({ message: "Captain account not found" });
        const isMember = yield routineMembers_Model_1.default.findOne({ RutineID: routineId, memberID: captainAccount._id });
        if (!isMember)
            return res.json({ message: "The account is not a member" });
        if (!isMember.captain) {
            isMember.captain = true;
            console.log(isMember);
            yield isMember.save();
        }
        res.json({ message: "Captain added successfully" });
    }
    catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
});
exports.addCaptain = addCaptain;
//************   removeCaptain      *************** */
const removeCaptain = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.body;
    const routineId = req.body.rutinid || req.body.routineID || req.body.routineId;
    try {
        const routine = yield routine_models_1.default.findOne({ _id: routineId });
        if (!routine)
            return res.json({ message: "Routine not found" });
        // Check if the logged-in user is the owner or captain
        const isHavePermission = yield routineMembers_Model_1.default.findOne({ RutineID: routineId, memberID: req.user.id });
        if (!isHavePermission || isHavePermission.owner === false) {
            return res.json({ message: "Only the owner can modify" });
        }
        const captainAccount = yield Account_Model_1.default.findOne({ username: username });
        if (!captainAccount)
            return res.json({ message: "Captain account not found" });
        const isMember = yield routineMembers_Model_1.default.findOne({ RutineID: routineId, memberID: captainAccount._id });
        if (!isMember)
            return res.json({ message: "The account is not a member" });
        if (isMember.captain) {
            isMember.captain = false;
            console.log(isMember);
            yield isMember.save();
        }
        res.json({ message: "Captain removed successfully" });
    }
    catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
});
exports.removeCaptain = removeCaptain;
