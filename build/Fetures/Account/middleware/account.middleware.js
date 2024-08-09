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
exports.validateAccountCreation = void 0;
const Account_Model_1 = __importDefault(require("../models/Account.Model"));
//********************* validateAccountCreation  ********************************************************* */
const validateAccountCreation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, username, password, phone, email, account_type, EIIN, contractInfo } = req.body;
    // Validation
    if (!email) {
        return res.status(400).json({ message: "Must have email or phone number" });
    }
    if (!name || !username || !password) {
        return res.status(400).json({ message: "Please fill the form" });
    }
    // Check if email is already taken
    const emailAlreadyUsed = yield Account_Model_1.default.findOne({ email });
    if (emailAlreadyUsed) {
        return res.status(400).json({ message: "Email already taken" });
    }
    // Check if username is already taken
    const usernameAlreadyTaken = yield Account_Model_1.default.findOne({ username });
    if (usernameAlreadyTaken) {
        return res.status(400).json({ message: "Username already taken" });
    }
    // Check if phone number is already used
    if (phone) {
        const phoneNumberExists = yield Account_Model_1.default.findOne({ phone });
        if (phoneNumberExists) {
            return res.status(400).json({ message: "Phone number already exists" });
        }
    }
    // If all validations pass, move to the next middleware or route handler
    next();
});
exports.validateAccountCreation = validateAccountCreation;
exports.default = exports.validateAccountCreation;
