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
exports.forgetPassword = exports.changePassword = exports.view_others_Account = exports.view_my_account = exports.searchAccounts = exports.edit_account = void 0;
const Account_Model_1 = __importDefault(require("../models/Account.Model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
//? firebase
const app_1 = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_storage_1 = require("../../../config/firebase/firebase_storage");
const routine_models_1 = __importDefault(require("../../Routines/models/routine.models"));
const storage = getStorage();
// Initialize Firebase
(0, app_1.initializeApp)(firebase_storage_1.firebaseConfig);
// Firebase auth
const admin = require('firebase-admin');
const { auth } = require("firebase-admin");
// const { use } = require('../../routes/account_route');
//**********************************************************************************************/
// ---------------------------------Edit Account --------------------------------------------/
//**********************************************************************************************/
// Account controller to update the account with images
const edit_account = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log(req.body);
    // console.log(req.files);
    // console.log("req.body");
    const { name, username, about, email } = req.body;
    try {
        const account = yield Account_Model_1.default.findOne({ _id: req.user.id });
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        // Handle the cover image
        const coverImage = req.files['cover'] ? req.files['cover'][0] : null;
        let coverImageURL = account.coverImage; // Existing cover image URL
        // 01619904210
        if (coverImage) {
            // Upload the cover image
            const timestamp = Date.now();
            const filename = `${account.username}-${account.name}-${timestamp}-${coverImage.originalname}`;
            const metadata = { contentType: coverImage.mimetype };
            const coverImageRef = ref(storage, `images/profile/ID-${account.id}/cover/-${filename}`);
            yield uploadBytes(coverImageRef, coverImage.buffer, metadata);
            coverImageURL = yield getDownloadURL(coverImageRef);
            // Delete the old cover image if it exists
            if (account.coverImage) {
                const oldCoverImageRef = ref(storage, account.coverImage);
                yield deleteObject(oldCoverImageRef);
            }
        }
        // Handle the profile image
        const profileImage = req.files['image'] ? req.files['image'][0] : null;
        let profileImageURL = account.image; // Existing profile image URL
        if (profileImage) {
            // Upload the profile image
            const timestamp = Date.now();
            const filename = `${account.username}-${account.name}-${timestamp}-${profileImage.originalname}`;
            const metadata = { contentType: profileImage.mimetype };
            const profileImageRef = ref(storage, `images/profile/ID-${account.id}/profile/-${filename}`);
            yield uploadBytes(profileImageRef, profileImage.buffer, metadata);
            profileImageURL = yield getDownloadURL(profileImageRef);
            // Delete the old profile image if it exists
            if (account.image && !account.googleSignIn) {
                const oldProfileImageRef = ref(storage, account.image);
                yield deleteObject(oldProfileImageRef);
            }
        }
        // Update the account with the new image URLs and other fields
        const update = yield Account_Model_1.default.updateOne({ _id: req.user.id }, {
            name,
            username,
            about,
            email,
            coverImage: coverImageURL,
            image: profileImageURL,
        });
        return res.status(200).json({ message: 'Account updated successfully', update });
    }
    catch (err) {
        console.error(err);
        // Delete the uploaded images if an error occurs
        // if (req.files) {
        //   const bucket = storage.bucket('your-bucket-name');
        //   if (req.files['cover']) {
        //     const coverImage = bucket.file(`images/cover/${getFilenameFromURL(req.files['cover'][0].originalname)}`);
        //     await coverImage.delete();
        //   }
        //   if (req.files['image']) {
        //     const profileImage = bucket.file(`images/profile/${getFilenameFromURL(req.files['image'][0].originalname)}`);
        //     await profileImage.delete();
        //   }
        // }
        return res.status(500).json({ message: 'Failed to update account', error: err });
    }
});
exports.edit_account = edit_account;
//.......... Search Account ....//
const searchAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { q: searchQuery = '', page = 1, limit = 10 } = req.query;
    // console.log("search ac");
    // console.log(req.query);
    try {
        const regex = new RegExp(searchQuery, 'i');
        const count = yield Account_Model_1.default.countDocuments({
            $or: [
                { username: { $regex: regex } },
                { name: { $regex: regex } },
                // Add more fields to search here
            ]
        });
        const accounts = yield Account_Model_1.default.find({
            $or: [
                { username: { $regex: regex } },
                { name: { $regex: regex } },
                // Add more fields to search here
            ]
        })
            .select('_id username name image')
            .limit(limit)
            .skip((page - 1) * limit);
        if (!accounts) {
            return res.status(404).send({ message: 'Not found' });
        }
        res.status(200).json({
            accounts,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalCount: count
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.searchAccounts = searchAccounts;
//........ View my account ...//
const view_my_account = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield Account_Model_1.default.findOne({ _id: req.user.id }).select('-Saved_routines -routines -__v');
        console.error(user);
        if (!user)
            return res.status(404).json({ message: "Account not found" });
        return res.status(200).json(user);
    }
    catch (error) {
        return res.status(404).json({ message: error.message });
    }
});
exports.view_my_account = view_my_account;
//....view others Account...//
const view_others_Account = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.params;
    console.log(username);
    try {
        const user = yield Account_Model_1.default.findOne({ username }, { password: 0 })
            .populate({
            path: 'routines Saved_routines',
            model: routine_models_1.default,
            options: {
                sort: { createdAt: -1 },
            },
            populate: {
                path: 'ownerid',
                model: Account_Model_1.default,
                select: 'name username image coverImage',
            },
        });
        if (!user)
            return res.status(404).json({ message: "User id not found " });
        return res.status(200).json(user.toObject({ getters: true }));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting routines" });
    }
});
exports.view_others_Account = view_others_Account;
//************************************************************************** */
// ---------------------    changePassword   --------------------------------/
//************************************************************************** */
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { oldPassword, newPassword } = req.body;
    try {
        // Step 1: Find the account by ID
        const account = yield Account_Model_1.default.findById(id);
        if (!account) {
            return res.status(400).json({ message: "Account not found" });
        }
        // Ensure the password is defined
        if (!account.password) {
            return res.status(400).json({ message: "Password not set for this account" });
        }
        // Step 2: Compare old password
        const passwordMatch = yield bcrypt_1.default.compare(oldPassword, account.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Old password is incorrect" });
        }
        // Step 3: Hash the new password
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        // Update the password on Firebase
        yield auth().updateUser(account.id, {
            password: newPassword
        });
        // Update the password in MongoDB
        account.password = hashedPassword;
        yield account.save();
        // Step 4: Send response
        res.status(200).json({ message: "Password changed successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error changing password" });
    }
});
exports.changePassword = changePassword;
// *****************     forgetPassword      *******************************/
const forgetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phone, username } = req.body;
    try {
        if (!email && !username)
            return res.status(400).json({ message: "Please fill the form" });
        // Find the account by ID
        const account = yield Account_Model_1.default.findOne({ $or: [{ email: email }, { phone: phone }, { username: username }] });
        if (!account)
            return res.status(400).json({ message: "username or email is not valid" });
        // Update the password
        // // Update the password on Firebase
        // const User =   await auth().
        // User.
        // await account.save();
        // Send response
        res.status(200).json({ message: "Password changed successfully", email: account.email });
        //console.error({ message: "Password changed successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error changing password" });
    }
});
exports.forgetPassword = forgetPassword;
