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
exports.notification_On = exports.notification_Off = exports.current_user_status = exports.recentNoticeByAcademeID = exports.recentNotice = exports.leaveMember = exports.joinNoticeboard = exports.deleteNotice = exports.addNotice = void 0;
// imports
const oneSignalNotification_controller_1 = require("../../../services/Notification services/oneSignalNotification.controller");
const notice_1 = __importDefault(require("../models/notice"));
const noticeboard_member_1 = __importDefault(require("../models/noticeboard_member"));
const Account_Model_1 = __importDefault(require("../../Account/models/Account.Model"));
//! firebase imports
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_stroage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_stroage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();
const norice_board_firebase_1 = require("../firebase/norice_board.firebase");
const uuid_1 = require("uuid");
const utils_1 = require("../../../utils/utils");
/// make a add to 
//?_______________________________________________________________________________________!//
///......... write code to add notice to notice bode 
const addNotice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { content_name, description, mimetypeChecked } = req.body;
    const { id, error } = req.user;
    const uuid = (0, uuid_1.v4)();
    try {
        if (error)
            return res.status(400).json({ message: 'PDF file is required' });
        if (!req.file)
            return res.status(400).json({ message: 'PDF file is required' });
        // Check file size
        const fileSize = req.file.size;
        if (fileSize > 11 * 1024 * 1024) {
            return res.status(400).json({ message: 'File size exceeds the allowed limit (10 MB)' });
        }
        // Check file type
        if (!mimetypeChecked) {
            const fileType = req.file.mimetype;
            if (fileType !== 'application/pdf') {
                //console.log({ message: 'Only PDF files are allowed' })
                throw res.status(400).json({ message: 'Only PDF files are allowed from code' });
            }
        }
        // Step 1: Find Account and check permission
        const findAccount = yield Account_Model_1.default.findById(id);
        if (!findAccount)
            return res.status(404).json({ message: 'Account not found' });
        const accountID = findAccount.id;
        // Step 2: Upload to Firebase Storage
        const pdfUrl = yield (0, norice_board_firebase_1.uploadFileToFirebaseAndGetDownloadUrl)(uuid, accountID, req.file);
        // const filename = `${accountID}-${uuid}-${req.file.originalname}`;
        // const metadata = { contentType: req.file.mimetype };
        // const storage = getStorage(); // Get a reference to the Firebase Storage bucket
        // const pdfRef = ref(storage, `notice/academyId-${accountID}/pdf/${filename}`); // Create a reference to the bucket
        // await uploadBytes(pdfRef, req.file.buffer, metadata);
        // const pdfUrl = await getDownloadURL(pdfRef);
        // Step 3: Save to MongoDB with PDF URL
        const notice = new notice_1.default({
            _id: uuid,
            content_name,
            pdf: pdfUrl,
            description,
            academyID: findAccount.id,
        });
        const savedNotice = yield notice.save();
        const NotificationMember = yield noticeboard_member_1.default
            .find({ academyID: id, notificationOn: true })
            .populate({
            path: 'memberID',
            select: 'osUserID',
            model: Account_Model_1.default,
        })
            .exec();
        const oneSignalUserId = NotificationMember
            .map((member) => member.memberID.osUserID)
            .filter((osUserId) => osUserId !== '' && osUserId !== undefined);
        console.log("oneSignalUserId");
        console.log(oneSignalUserId);
        // Step 4: Create a notification with Firebase
        const response = yield (0, oneSignalNotification_controller_1.sendNotificationMethods)(oneSignalUserId, `A New Notice from ${findAccount.name}`, "New Notice");
        res.status(200).json({ message: 'Notice created and added successfully', notice: savedNotice });
        console.log(savedNotice);
    }
    catch (error) {
        console.error("error");
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});
exports.addNotice = addNotice;
// //************  Delete Notice ***************************/
const deleteNotice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { noticeId } = req.params;
    const { id } = req.user;
    const session = yield notice_1.default.startSession();
    session.startTransaction();
    try {
        // Step 1: Find Account and check permission
        const findAccount = yield Account_Model_1.default.findById(id);
        if (!findAccount)
            return res.status(404).json({ message: 'Account not found' });
        // Step 2: Find the notice
        const notice = yield notice_1.default.findById(noticeId);
        if (!notice)
            return res.status(404).json({ message: 'Notice not found' });
        // Step 3: Check if the notice belongs to the user
        if (notice.academyID.toString() !== findAccount._id.toString()) {
            return res.status(403).json({ message: 'You do not have permission to delete this notice' });
        }
        // Step 4: Delete notice from MongoDB
        yield notice_1.default.findByIdAndDelete(noticeId).session(session);
        // Step 5: Delete notice file from Firebase Storage
        const storage = getStorage();
        const pdfRef = ref(storage, notice.pdf);
        try {
            yield deleteObject(pdfRef);
        }
        catch (storageError) {
            console.error('Error deleting notice file from Firebase Storage:', storageError);
            // Handle storage error if needed
        }
        yield session.commitTransaction();
        // Return 204 No Content status for a successful deletion
        res.status(200).json({ message: 'Notice deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting notice:', error);
        // Rollback the transaction
        yield session.abortTransaction();
        res.status(500).json({ message: 'Error deleting notice', error: error.message });
    }
    finally {
        session.endSession();
    }
});
exports.deleteNotice = deleteNotice;
//************  join noticeboard ***************************/
const joinNoticeboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { academyID } = req.params;
    const { id } = req.user;
    try {
        if (!academyID) {
            return res.status(400).json({ message: 'AcademyID is required' });
        }
        // Check if the account exists
        const account = yield Account_Model_1.default.findById(academyID);
        if (!account) {
            return res.status(404).json({ message: 'Academy not found' });
        }
        // Check if the user is already a member
        const existingMember = yield noticeboard_member_1.default.findOne({
            academyID,
            memberID: id,
        });
        if (existingMember) {
            return res.status(409).json({ message: 'You are already a member' });
        }
        // Join as a member
        const newMember = new noticeboard_member_1.default({
            academyID,
            memberID: id,
        });
        // Save and send the response
        yield newMember.save();
        res.status(200).json({ message: 'You are now a member of this noticeboard' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});
exports.joinNoticeboard = joinNoticeboard;
//************  leaveMember ***************************/
const leaveMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { academyID } = req.params;
    const { id } = req.user;
    try {
        if (!academyID) {
            return res.status(400).json({ message: 'AcademyID is required' });
        }
        // Check if the account exists
        const findAcademy = yield Account_Model_1.default.findById(academyID);
        if (!findAcademy)
            return res.status(404).json({ message: 'Account not found' });
        // Check if the user is already a member
        const allradyMember = yield noticeboard_member_1.default.findOne({
            academyID,
            memberID: id,
        });
        if (!allradyMember) {
            return res.status(404).json({ message: 'You have already left' });
        }
        // Delete the member
        yield noticeboard_member_1.default.findOneAndDelete({
            academyID,
            memberID: id,
        });
        res.send({
            message: 'Successfully left the noticeboard',
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});
exports.leaveMember = leaveMember;
// recentNotice
const recentNotice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { page = 1, limit = 10 } = req.query;
    try {
        const allJoinedNoticeBaord = yield noticeboard_member_1.default.find({ memberID: id }).select('-_id academyID');
        const academyIDs = allJoinedNoticeBaord.map((item) => item.academyID);
        const count = yield notice_1.default.countDocuments({ academyID: { $in: academyIDs } });
        const totalPages = Math.ceil(count / limit);
        const notices = yield notice_1.default.find({ academyID: { $in: academyIDs } })
            .select('-__v')
            .limit(limit)
            .populate({
            path: 'academyID',
            model: Account_Model_1.default,
            select: 'name username image',
        })
            .sort({ time: -1 });
        //notices
        //const final_notice_with_no_null_academtid = notices.filter(notice => notice.academyID !== null);
        const final_notice_with_no_null_academtid = notices.filter((notice) => notice.academyID !== null);
        // const noticesWithPDFs = await fb.getNoticePDFs(final_notice_with_no_null_academtid);
        res.status(200).json({
            message: "success All recent mnotice",
            notices: final_notice_with_no_null_academtid,
            currentPage: parseInt(page),
            totalPages,
            totalCount: count,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});
exports.recentNotice = recentNotice;
// view all notices by notice id
const recentNoticeByAcademeID = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { academyID } = req.params;
    const { page = 1, limit = 10 } = req.query;
    try {
        const findAccount = yield Account_Model_1.default.find({ id: academyID });
        if (!findAccount)
            return res.status(404).json({ message: "Account not found" });
        //
        const count = yield notice_1.default.countDocuments({ academyID: academyID });
        const totalPages = Math.ceil(count / limit);
        const notices = yield notice_1.default.find({ academyID: academyID })
            .select('-__v')
            .limit(limit)
            .populate({
            path: 'academyID',
            model: Account_Model_1.default,
            select: 'name username image',
        })
            .sort({ time: -1 });
        const final_notice_with_no_null_Academy_ID = notices.filter((notice) => notice.academyID !== null);
        // const noticesWithPDFs = await fb.getNoticePDFs(notices);
        res.status(200).json({
            message: "success",
            notices: final_notice_with_no_null_Academy_ID,
            currentPage: parseInt(page),
            totalPages,
            totalCount: count,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});
exports.recentNoticeByAcademeID = recentNoticeByAcademeID;
//**************  current_user_status     *********** */
const current_user_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { academyID } = req.params;
        const { id } = req.user;
        (0, utils_1.printD)("academyID  " + academyID);
        let isOwner = false;
        let activeStatus = "not_joined";
        let isSave = false;
        let notificationOn = false;
        // Find the NoticeBoard to check user status
        const noticeBoard = yield Account_Model_1.default.findOne({ _id: academyID });
        if (!noticeBoard) {
            return res.json({ message: "NoticeBoard not found" });
        }
        // Check if the user has a pending request
        const foundMember = yield noticeboard_member_1.default.findOne({
            academyID: academyID,
            memberID: id
        });
        // console.log(foundMember);
        if (foundMember) {
            activeStatus = "joined";
            // Check if the user is the owner
            if (foundMember.academyID.toString() === id) {
                isOwner = true;
                // Check if notification is enabled
                if (foundMember.notificationOn === true) {
                    notificationOn = true;
                }
            }
        }
        res.status(200).json({
            message: "Check noticeboard Status",
            isOwner,
            activeStatus,
            isSave,
            notificationOn,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});
exports.current_user_status = current_user_status;
//************* Notification on /off **************//
const notification_Off = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { academyID } = req.params;
    const { id } = req.user;
    try {
        // Step 1: Find the academy account
        const academyAccount = yield Account_Model_1.default.findById(academyID);
        if (!academyAccount) {
            return res.status(404).json({ message: "Academy account not found" });
        }
        // Step 2: Check if the user is a member
        const foundMember = yield noticeboard_member_1.default.findOne({ academyID: academyID, memberID: id });
        if (!foundMember) {
            return res.status(404).json({ message: "You are not a member of this Academy" });
        }
        // Step 3: Check if the user has already turned off notifications
        if (!foundMember.notificationOn) {
            return res.status(200).json({ message: "Notifications are already turned off", notificationOn: false });
        }
        // Step 4: Update notificationOn field to false
        yield noticeboard_member_1.default.findOneAndUpdate({ academyID, memberID: id }, { notificationOn: false });
        res.status(200).json({ message: "Notifications turned off", notificationOn: false });
        //
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});
exports.notification_Off = notification_Off;
//************* Notification on**************//
const notification_On = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { academyID } = req.params;
    const { id } = req.user;
    try {
        // Step 1: Find the academy account
        const academyAccount = yield Account_Model_1.default.findById(academyID);
        if (!academyAccount) {
            return res.status(404).json({ message: "Academy account not found" });
        }
        // Step 2: Check if the user is a member
        const foundMember = yield noticeboard_member_1.default.findOne({ academyID: academyID, memberID: id });
        if (!foundMember) {
            return res.status(404).json({ message: "You are not a member of this Academy" });
        }
        // Step 3: Check if the user has already turned on notifications
        if (foundMember.notificationOn) {
            return res.status(200).json({ message: "Notifications are already turned on", notificationOn: true });
        }
        // Step 4: Update notificationOn field to true
        yield noticeboard_member_1.default.findOneAndUpdate({ academyID, memberID: id }, { notificationOn: true });
        res.status(200).json({ message: "Notifications turned on", notificationOn: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});
exports.notification_On = notification_On;
