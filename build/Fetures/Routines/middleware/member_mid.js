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
exports.permission_add_Pride = exports.peremption_add_member = void 0;
// Models
const routine_models_1 = __importDefault(require("../models/routine.models"));
const routineMembers_Model_1 = __importDefault(require("../models/routineMembers.Model"));
const peremption_add_member = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { rutin_id } = req.params;
    try {
        // 1. Find Routine and Pride
        const routine = yield routine_models_1.default.findOne({ _id: rutin_id });
        if (!routine)
            return res.status(404).json({ message: "Routine not found." });
        // 2. Check permission is owner or captain
        const cap10s = routine.cap10s.map((c) => c.cap10Ac.toString());
        if (routine.ownerid.toString() === req.user.id || cap10s.includes(req.user.id)) {
            req.routine = routine;
            next();
        }
        else {
            // user is not owner or captain
            return res.status(401).json({ message: "You don't have permission to add a member." });
        }
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error: " + err.message });
    }
});
exports.peremption_add_member = peremption_add_member;
//***************************************************************** */
// permission_add_prided
const permission_add_Pride = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID } = req.params;
    try {
        // 1. Find Routine and Pride
        const routine = yield routine_models_1.default.findOne({ _id: routineID });
        if (!routine)
            return res.status(404).json({ message: "Routine not found" });
        // 2. Check permission is owner or captain
        const routineMember = yield routineMembers_Model_1.default.findOne({ RutineID: routineID, memberID: req.user.id });
        if (!(routineMember === null || routineMember === void 0 ? void 0 : routineMember.owner) && !(routineMember === null || routineMember === void 0 ? void 0 : routineMember.captain)) {
            return res.status(401).json({ message: "You don't have permission to add priode" });
        }
        // req.routine = routine;
        next();
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error: " + err.message });
    }
});
exports.permission_add_Pride = permission_add_Pride;
