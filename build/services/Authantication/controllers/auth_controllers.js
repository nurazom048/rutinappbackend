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
exports.createAccount = exports.loginAccount = void 0;
// Firebase admin sdk from Firebase config
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccount = require('../../../config/firebase/admin.sdk');
// const serviceAccountCredentials = JSON.stringify(serviceAccount);
firebase_admin_1.default.initializeApp({ credential: firebase_admin_1.default.credential.cert(serviceAccount) });
const firebseAdmine = firebase_admin_1.default;
// Firebase auth from Firebase config
const auth_1 = require("firebase/auth");
const firebaseApp = require('../../../config/firebase/firebase.config');
const auth = (0, auth_1.getAuth)(firebaseApp);
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables from .env file
const bcrypt_1 = __importDefault(require("bcrypt"));
const Jwt_helper_1 = require("../helper/Jwt.helper");
const pending_account_model_1 = __importDefault(require("../../../Fetures/Account/models/pending_account.model"));
const Account_Model_1 = __importDefault(require("../../../Fetures/Account/models/Account.Model"));
//*********** loginAccount **********/
const loginAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, phone, email, osUserID } = req.body;
    // console.log(req.body);
    try {
        let account;
        let pendingAccount;
        //.. check is pending or not 
        if (username) {
            pendingAccount = yield pending_account_model_1.default.findOne({ username });
        }
        if (email) {
            pendingAccount = yield pending_account_model_1.default.findOne({ email });
        }
        if (pendingAccount) {
            const pendingAccountCredential = yield firebase_admin_1.default.auth().getUserByEmail(pendingAccount.email);
            console.log('pendingAccountCredential');
            console.log(pendingAccount);
            // Check if email is verified
            if (!pendingAccountCredential.emailVerified) {
                return res.status(401).json({ message: "Email is not verified", account: { email: pendingAccount.email }, pendigAccount: pendingAccount });
            }
            if (!pendingAccount.isAccept) {
                return res.status(402).json({ message: "Academy request is pending", account: { email: pendingAccount.email }, pendigAccount: pendingAccount });
            }
        }
        if (username) {
            // Find user by username
            account = yield Account_Model_1.default.findOne({ username });
        }
        else if (phone) {
            // Find user by phone
            account = yield Account_Model_1.default.findOne({ phone });
        }
        else if (email) {
            // Find user by email
            account = yield Account_Model_1.default.findOne({ email });
        }
        if (!account) {
            return res.status(400).json({ message: "User not found" });
        }
        if (account.googleSignIn) {
            return res.status(400).json({ message: "Try To Continue With Google" });
        }
        // Compare passwords
        const passwordMatch = yield bcrypt_1.default.compare(password, account.password);
        if (!passwordMatch && password === account.password) {
            return res.status(400).json({ message: "Incorrect password" });
        }
        // Sign in with email and password on firebase
        const userCredential = yield (0, auth_1.signInWithEmailAndPassword)(auth, account.email, password);
        // Check if email is verified
        const user = userCredential.user;
        if (!user.emailVerified) {
            return res.status(401).json({ message: "Email is not verified", email: email, password: user, account });
        }
        // Create a new auth token and refresh token
        const authToken = (0, Jwt_helper_1.generateAuthToken)(account._id, account.username);
        const refreshToken = (0, Jwt_helper_1.generateRefreshToken)(account._id, account.username);
        // Set the tokens in the any headers
        res.setHeader('Authorization', `Bearer ${authToken}`);
        res.setHeader('x-refresh-token', refreshToken);
        //Encrypt the new password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // Find user and update password
        const updated = yield Account_Model_1.default.findByIdAndUpdate(account._id, { password: hashedPassword, osUserID: osUserID, lastLoginTime: Date.now() }, { new: true });
        // Send any with token and account details
        res.status(200).json({ message: "Login successful", token: authToken, account });
    }
    catch (error) {
        console.error(error);
        if (error.code === "auth/wrong-password") {
            // Handle invalid email error
            res.status(400).json({ message: "wrong password" });
        }
        else if (error.code === "auth/invalid-email") {
            // Handle invalid email error
            res.status(400).json({ message: "Invalid email" });
        }
        else {
            // Handle other Firebase errors
            res.status(500).json({ message: `Error logging in: ${error.message}` });
        }
    }
});
exports.loginAccount = loginAccount;
const createAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const { name, username, password, phone, email, account_type, EIIN, contractInfo } = req.body;
    try {
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
        //! if academy move to pending request to create new account
        if (account_type === 'academy') {
            // Call the createPendingRequest function
            const any = yield createPendingRequest(req, res);
            return res.status(200).json(any);
        }
        else {
            //Encrypt the new password
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            const account = new Account_Model_1.default({ name, username, password: hashedPassword, phone, email });
            // Check if email is taken or not
            try {
                yield firebase_admin_1.default.auth().getUserByEmail(account.email.toString());
                return res.status(401).json({ message: "Email is already taken" });
            }
            catch (error) {
                if (error.code !== 'auth/user-not-found') {
                    return res.status(500).json({ message: "Error checking email availability" });
                }
            }
            const firebaseAuthCreate = yield firebase_admin_1.default.auth().createUser({
                displayName: account.name,
                uid: account.id,
                email: email,
                password: password,
                emailVerified: false,
            });
            const createdAccount = yield account.save();
            // Send any
            res.status(200).json({ message: "Account created successfully", createdAccount, firebaseAuthCreate });
        }
    }
    catch (error) {
        console.error(error);
        if (error.code === "auth/invalid-email") {
            res.status(400).json({ message: "Invalid email" });
        }
        else if (error.code === "auth/email-already-in-use") {
            res.status(400).json({ message: "Email already taken" });
        }
        else if (error.code === "auth/weak-password") {
            res.status(400).json({ message: "Weak password" });
        }
        else {
            res.status(500).json({ message: `Error creating account: ${error.message}` });
        }
    }
});
exports.createAccount = createAccount;
/////////////////////
// Create the createPendingRequest function
const createPendingRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, username, password, phone, email, account_type, EIIN, contractInfo } = req.body;
    if (!EIIN)
        return { message: 'EIIN Number is required' };
    if (!contractInfo)
        return { message: 'contractInfo is required' };
    const emailAlreadyUsed = yield pending_account_model_1.default.findOne({ email });
    if (emailAlreadyUsed) {
        return { message: "Request already pending with this email" };
    }
    const EIINAlreadyUsed = yield pending_account_model_1.default.findOne({ EIIN });
    if (EIINAlreadyUsed) {
        return { message: "Request already pending with this EIIN" };
    }
    //Encrypt the new password
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const account = new pending_account_model_1.default({
        name,
        username,
        password: hashedPassword,
        phone,
        email,
        account_type,
        contractInfo,
        EIIN,
    });
    const firebaseAuthCreate = yield firebase_admin_1.default.auth().createUser({
        displayName: account.name,
        uid: account.id,
        email: email,
        password: password,
        emailVerified: false,
    });
    const createdAccount = yield account.save();
    return { message: "Request sent successfully", createdAccount, firebaseAuthCreate };
});
// //***********   deleteAccount       **********/
// export const deleteAccount = async (req:any, res:a) => {
//   const { id } = req.params;
//   try {
//     console.log(req.user);
//     const findAccount = await Account.findById(id);
//     if (!findAccount) return res.status(400).json({ message: "Account not found" });
//     if (findAccount.id, toString() !== req.user.id) returnres.status(400).json({ message: " you can only delete your  Account " });
//     // Send any
//     console.log(findAccount._id);
//     // findAccount.delete();
//     res.status(200).json({ message: "Account deleted successfully" });
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({ message: "Error deleting account" });
//   }
// };
// //************** rejectPending ********************* */
// export const rejectPending = async (req: any, res: any) => {
//   const { id } = req.params;
//   try {
//     const account = await PendingAccount.findById(id);
//     if (!account) {
//       return res.status(400).json({ message: "Account not found" });
//     }
//     if (account && account.isAccept !== null) {
//       return res.status(200).json({ message: "Request already accepted" });
//     }
//     // Delete user from Firebase authentication
//     try {
//       await admin.auth().deleteUser(account.id);
//     } catch (error: any) {
//       console.error(error);
//       return res.status(500).json({ message: "Error deleting user from Firebase authentication" });
//     }
//     // Delete account from pending requests
//     await PendingAccount.findByIdAndDelete(id);
//     res.status(200).json({ message: "Account rejected and deleted successfully" });
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({ message: "Error rejecting pending request" });
//   }
// };
