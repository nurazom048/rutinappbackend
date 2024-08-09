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
exports.acceptPending = exports.allPendingAccount = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// models
const Account_Model_1 = __importDefault(require("../../../Fetures/Account/models/Account.Model"));
// methods
const mongodb_1 = require("mongodb");
const pending_account_model_1 = __importDefault(require("../../../Fetures/Account/models/pending_account.model"));
const auth_methods_1 = require("./auth.methods");
// ***************** allPendingAccount *******************************/
const allPendingAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accounts = yield pending_account_model_1.default.find({ isAccept: false }).sort({ sendTime: 1 });
        res.status(200).json({ message: "All pending accounts", pendingAccounts: accounts });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving pending accounts" });
    }
});
exports.allPendingAccount = allPendingAccount;
//************** acceptPending ********************* */
const acceptPending = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const pendingAccount = yield pending_account_model_1.default.findById(id);
        console.log('PendingAccount', pendingAccount);
        if (!pendingAccount) {
            return res.status(404).json({ message: "Pending account not found" });
        }
        if (pendingAccount.isAccept) {
            return res.status(200).json({ message: "Request already accepted" });
        }
        const name = pendingAccount.name;
        const pendingAccountId = pendingAccount.id;
        const username = pendingAccount.username;
        const password = pendingAccount.password;
        const phone = pendingAccount.phone;
        const email = pendingAccount.email;
        const EIIN = pendingAccount.EIIN;
        const googleSignIn = pendingAccount.googleSignIn;
        const account_type = pendingAccount.account_type;
        try {
            // Check if email is taken or not
            if (!email) {
                return res.status(404).json({ message: "Email not found" });
            }
            const firebase = yield firebase_admin_1.default.auth().getUserByEmail(email);
            if (!firebase)
                return res.status(401).json({ message: "User not found" });
        }
        catch (error) {
            if (error.code !== 'auth/user-not-found') {
                return res.status(500).json({ message: "Error checking email availability" });
            }
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
        // Create user
        const objectId = new mongodb_1.ObjectId(pendingAccountId);
        const createNewAccount = new Account_Model_1.default({
            id: objectId,
            name,
            username,
            password,
            email,
            EIIN,
            account_type,
            googleSignIn,
        });
        // Check if the phone field is set and not undefined
        if (phone !== undefined) {
            createNewAccount.phone = phone;
        }
        const ceated = yield createNewAccount.save();
        console.log('created account  : ' + ceated);
        // Update the pending account
        pendingAccount.isAccept = true;
        yield pendingAccount.save();
        //
        // Join His owen noticeboard
        const result = yield (0, auth_methods_1.joinHisOwnNoticeboard)(objectId);
        if (result) {
            return res.status(500).json(result);
        }
        else {
            res.status(200).json({ message: "Account created successfully", createNewAccount });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error accepting pending request" });
    }
});
exports.acceptPending = acceptPending;
