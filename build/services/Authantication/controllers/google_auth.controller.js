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
exports.continueWithGoogle = void 0;
const Account_Model_1 = __importDefault(require("../../../Fetures/Account/models/Account.Model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_methods_1 = require("./auth.methods");
const Jwt_helper_1 = require("../../../services/Authantication/helper/Jwt.helper");
const pending_account_model_1 = __importDefault(require("../../../Fetures/Account/models/pending_account.model"));
dotenv_1.default.config();
// Firebase admin sdk from Firebase config
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccount = require('../../../config/firebase/admin.sdk');
// Firebase auth from Firebase config
const auth_1 = require("firebase/auth");
const firebaseApp = require('../../../config/firebase/firebase.config');
const auth = (0, auth_1.getAuth)(firebaseApp);
//****************************************************************************************************/
// --------------------------------- Continue With Google --------------------------------------------/
//****************************************************************************************************/
const continueWithGoogle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { googleAuthToken, account_type } = req.body;
    try {
        // Step 1: Verify the Google Auth Token
        // const token = googleAuthToken;
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.decode(googleAuthToken);
        }
        catch (error) {
            return res.status(500).json({ message: error });
        }
        if (!decodedToken) {
            return res.status(500).json({ message: 'No Token Found' });
        }
        const userId = decodedToken.user_id;
        const name = decodedToken.name;
        const image = decodedToken.picture;
        const userEmail = decodedToken.email;
        const displayName = decodedToken.name;
        //............................................................................................//
        //............................... login............. .......................................//
        //............................................................................................//
        // If pending then go to pending page
        const pendingAccount = yield pending_account_model_1.default.findOne({ email: userEmail });
        if (pendingAccount) {
            // Check if accept or not
            if (!pendingAccount.isAccept) {
                return res.status(402).json({ message: "Academy request is pending", account: { email: pendingAccount.email }, pendingAccount });
            }
        }
        // Step 2: Check if the user already has an account
        const existUser = yield Account_Model_1.default.findOne({ email: userEmail });
        // TODo for pending
        if (existUser) {
            const ifGoogleSignEnable = existUser.googleSignIn;
            if (ifGoogleSignEnable) {
                // Create a new auth token and refresh token
                const authToken = (0, Jwt_helper_1.generateAuthToken)(existUser._id, existUser.username);
                const refreshToken = (0, Jwt_helper_1.generateRefreshToken)(existUser._id, existUser.username);
                // Set the tokens in the any headers
                res.setHeader('Authorization', `Bearer ${authToken}`);
                res.setHeader('x-refresh-token', refreshToken);
                // send success response
                console.log({ message: "Login successful", token: authToken, account: existUser });
                return res.status(200).json({ message: "Login successful", token: authToken, account: existUser });
            }
        }
        // If User is not created then create first then return token
        const username = yield (0, auth_methods_1.generateUniqUsername)(userEmail);
        if (yield Account_Model_1.default.findOne({ username })) {
            return res.status(401).json({ message: "Username already exists" });
        }
        if (yield Account_Model_1.default.findOne({ email: userEmail })) {
            return res.status(401).json({ message: "Email already exists" });
        }
        //............................................................................................//
        //............................... Sign Up............. .......................................//
        //............................................................................................//
        if (!userId || !name || !username || !userEmail) {
            return res.status(400).json({ message: "Please fill the form" });
        }
        // step: Chak if ths is academy or not
        if (account_type == 'academy') {
            // Call the createPendingRequest function
            const response = yield createPendingRequest(req, res, decodedToken);
            return res.status(201).json(response);
        }
        // Step 3: Create user in MongoDB
        const account = new Account_Model_1.default({ name, image, username, email: userEmail, googleSignIn: true });
        // Step 4: Update user in Firebase
        yield firebase_admin_1.default.auth().deleteUser(userId.toString());
        firebase_admin_1.default.auth().createUser({
            uid: account.id || account._id,
            displayName: name,
            photoURL: image,
            email: userEmail,
            emailVerified: true,
        });
        yield account.save();
        // Create a new auth token and refresh token
        const authToken = (0, Jwt_helper_1.generateAuthToken)(account._id, account.username);
        const refreshToken = (0, Jwt_helper_1.generateRefreshToken)(account._id, account.username);
        // Set the tokens in the response headers
        res.setHeader('Authorization', `Bearer ${authToken}`);
        res.setHeader('x-refresh-token', refreshToken);
        console.log({ message: "Login successful", token: authToken, account: account });
        res.status(200).json({ message: "Login successful", token: authToken, account: account });
    }
    catch (error) {
        console.error("Error processing Google Auth Token:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.continueWithGoogle = continueWithGoogle;
//............................................................................................//
//............................... createPendingRequest........................................//
//............................................................................................//
const createPendingRequest = (req, res, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const { account_type, EIIN, contractInfo } = req.body;
    const userId = decodedToken.user_id;
    const name = decodedToken.name;
    const image = decodedToken.picture;
    const email = decodedToken.email;
    //
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
    const username = yield (0, auth_methods_1.generateUniqUsername)(email);
    const account = new pending_account_model_1.default({ id: userId, name, username, email, image, account_type, contractInfo, EIIN, googleSignIn: true });
    const firebaseAuthCreate = yield firebase_admin_1.default.auth().updateUser(userId, { email: email, displayName: name, emailVerified: true });
    const createdAccount = yield account.save();
    return { message: "Request sent successfully", createdAccount, firebaseAuthCreate };
});
