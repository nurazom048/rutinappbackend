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
exports.checkAccountType = void 0;
const Account_Model_1 = __importDefault(require("../../Account/models/Account.Model"));
const utils_1 = require("../../../utils/utils");
//
//*****************************************************************************/
//
//_____________________ Check if the Account type is Academy Or not__________//
//
//*****************************************************************************/
const checkAccountType = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    try {
        if (!id) {
            return res.status(401).json({ message: 'Authentication failed. Please log in again.' });
        }
        // Step 1: Find account and check account type
        const account = yield Account_Model_1.default.findById(id);
        if ((account === null || account === void 0 ? void 0 : account.account_type) !== "academy" /* AccountType.Academy */) {
            return res.status(401).json({ message: 'Only Academy Can Upload Notice' });
        }
        next(); // Call next middleware if the account type is correct
    }
    catch (error) {
        // Handle errors gracefully
        (0, utils_1.printError)('Error while checking account type:' + error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
exports.checkAccountType = checkAccountType;
