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
exports.remove_summary = exports.saveUnsaveSummary = exports.summary_status = exports.update_summary = exports.get_class_summary_list = exports.create_summary = void 0;
// Models
const Account_Model_1 = __importDefault(require("../../Account/models/Account.Model"));
const routine_models_1 = __importDefault(require("../models/routine.models"));
const class_model_1 = __importDefault(require("../models/class.model"));
const summary_models_1 = __importDefault(require("../models/summary.models"));
const routineMembers_Model_1 = __importDefault(require("../models/routineMembers.Model"));
const save_summary_model_1 = __importDefault(require("../models/save_summary.model"));
// firebase
const summary_firebase_1 = require("../firebase/summary.firebase");
//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_storage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_storage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();
//************   create summary        *************** *//
// Create Summary
const create_summary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { message, checkedType } = req.body;
    const { class_id } = req.params;
    const { id } = req.user;
    try {
        // Step 1: Find class
        const findClass = yield class_model_1.default.findOne({ _id: class_id });
        if (!findClass)
            return res.status(404).send({ message: 'Class not found' });
        const routineID = findClass.rutin_id;
        // TODO onle member can upload summary
        // Step 2: Check MIME types of uploaded files
        const allowedMimeTypes = ['image/jpeg', 'image/png']; // Add more allowed MIME types if needed
        // const invalidFiles = req.files.filter(file => !allowedMimeTypes.includes(file.mimetype));
        const invalidFiles = req.files.filter((file) => !allowedMimeTypes.includes(file.mimetype));
        //console.log(invalidFiles)
        if (invalidFiles.length > 0 && !checkedType) {
            const invalidFileNames = invalidFiles.map((file) => file.originalname);
            return res.status(400).send({ message: `Invalid file types: ${invalidFileNames.join(', ')}` });
        }
        // Step 2: Upload summary's to Firebase Storage
        const downloadUrls = yield (0, summary_firebase_1.summaryImageUploader)({
            files: req.files,
            class_id,
            routineID: routineID,
        });
        // Step 3: Create instance
        const summary = new summary_models_1.default({
            ownerId: id,
            text: message,
            imageLinks: downloadUrls,
            routineId: routineID,
            classId: findClass.id,
        });
        // Step 4: Save and send response
        const createdSummary = yield summary.save();
        // console.log(createdSummary);
        // console.log(id);
        return res.status(201).json({
            message: 'Summary created successfully',
            summary: createdSummary,
            downloadUrls,
        });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
});
exports.create_summary = create_summary;
const io = require("socket.io");
//
//************ Get class summary list *************** */
const get_class_summary_list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { class_id } = req.params;
    const { id } = req.user;
    const { page = 1, limit = 10 } = req.query;
    // console.log(class_id)
    // console.log(page)
    try {
        let query = { classId: class_id };
        if (!class_id) {
            // Step 1: find class
            const findAccount = yield Account_Model_1.default.findOne({ _id: id });
            if (!findAccount)
                return res.status(404).send({ message: 'Class not found' });
            // Find saved summaries
            const savedSummary = yield save_summary_model_1.default.find({ savedByAccountId: id });
            // Create an array with _id values
            // const summaryIdArray = savedSummary.map(summary => summary.summaryId);
            // console.log(summaryIdArray);
            const summaryIdArray = savedSummary.map((summary) => summary.summaryId);
            // Update the query to include the saved summaries
            query = { _id: { $in: summaryIdArray } };
        }
        else {
            const classInstance = yield class_model_1.default.findOne({ _id: class_id });
            if (!classInstance)
                return res.status(404).json({ message: 'Class not found' });
        }
        const count = yield summary_models_1.default.countDocuments(query);
        const summaries = yield summary_models_1.default.find(query, { __v: 0 })
            .populate({
            path: 'ownerId',
            model: Account_Model_1.default,
            select: 'name username image'
        })
            .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
            .skip((page - 1) * limit)
            .limit(limit);
        if (!summaries) {
            return res.status(404).json({ message: 'Not found' });
        }
        return res.status(200).json({
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalCount: count,
            message: 'All the summaries',
            summaries: summaries,
        });
    }
    catch (error) {
        return res.status(400).json({ message: error });
    }
});
exports.get_class_summary_list = get_class_summary_list;
//************ update  summary list *************** */
const update_summary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { summary_id } = req.params;
    const { id } = req.user;
    try {
        // find the class that contains the summary
        const finsSummary = yield summary_models_1.default.findByIdAndUpdate(summary_id, { text: req.body.text });
        // const classInstance = await Class.findOne({ 'summary._id': summary_id });
        if (!finsSummary)
            return res.status(404).json({ message: 'Summary not found' });
        // find the routine that contains the class and check if the current user has permission to edit
        const routineInstance = yield routine_models_1.default.findById(finsSummary.id);
        if (!routineInstance)
            return res.status(404).json({ message: 'Routine not found' });
        if (id !== routineInstance.ownerid.toString() && finsSummary.ownerId !== id)
            return res.status(401).json({ message: 'You do not have permission to edit a summary' });
        // update the summary and send response
        const updatedSummary = yield summary_models_1.default.findByIdAndUpdate(summary_id, { text: req.body.text });
        if (!updatedSummary) {
            return res.status(404).json({ message: "Summary not found" });
        }
        return res.status(200).send({ message: "Summary Updated successfully" });
    }
    catch (error) {
        return res.status(400).send(error.message);
    }
});
exports.update_summary = update_summary;
//************* SUMMARY STATUS ********************/
const summary_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { summary_id } = req.params;
        const { id } = req.user;
        // console.log("summary_status id");
        // console.log(summary_id);
        let summaryOwner = false;
        let isOwner = false;
        let isCaptain = false;
        let isSummarySaved = false;
        // Find the Summary to check user status
        const foundSummary = yield summary_models_1.default.findById(summary_id);
        if (!foundSummary) {
            return res.status(500).json({ message: 'Summary Not Found' });
        }
        console.log(id);
        if (foundSummary.ownerId == id) {
            summaryOwner = true;
        }
        // Find the routine to check user status
        const routine = yield routine_models_1.default.findOne({ _id: foundSummary.routineId });
        console.log(routine);
        if (!routine) {
            return res.status(404).json({ message: "Routine not found" });
        }
        // Check if the user is the owner
        const isOwnerFind = yield routineMembers_Model_1.default.findOne({ memberID: id, RutineID: foundSummary.routineId, owner: true });
        if (isOwnerFind) {
            isOwner = true;
        }
        // Check if the user is a captain
        const isCaptainFind = yield routineMembers_Model_1.default.findOne({ memberID: req.user.id, RutineID: foundSummary.routineId, captain: true });
        if (isCaptainFind) {
            isCaptain = true;
        }
        const ifsvaed = yield save_summary_model_1.default.findOne({ summaryId: foundSummary.id, savedByAccountId: id });
        if (ifsvaed) {
            isSummarySaved = true;
        }
        res.status(200).json({
            summaryOwner,
            isOwner,
            isCaptain,
            isSummarySaved,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
});
exports.summary_status = summary_status;
//**************** save unsave summary***************** */
const saveUnsaveSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: userId } = req.user;
        const { save, summaryId } = req.body;
        // Find the summary by ID
        const foundSummary = yield summary_models_1.default.findById(summaryId);
        if (!foundSummary) {
            return res.status(404).json({ message: 'Summary not found' });
        }
        const query = {
            summaryId,
            routineId: foundSummary.routineId,
            savedByAccountId: userId,
            classId: foundSummary.classId,
        };
        switch (save) {
            case 'true':
                // Check if the summary is already saved
                const isSaved = yield save_summary_model_1.default.findOne(query);
                if (isSaved) {
                    return res.status(409).json({ message: 'Summary already saved' });
                }
                // Create a new SaveSummary document
                const saveSummary = new save_summary_model_1.default(query);
                // Save the summary
                const savedSummary = yield saveSummary.save();
                return res.status(200).json({
                    message: 'Summary saved successfully',
                    save: true,
                    savedSummary
                });
            case 'false':
                // Find the saved summary by summary ID and user ID
                const ifsvaed = yield save_summary_model_1.default.findOne(query);
                if (!ifsvaed) {
                    return res.status(404).json({ message: 'Saved summary not found' });
                }
                // Remove the saved summary
                yield save_summary_model_1.default.findOneAndDelete(query);
                return res.status(200).json({
                    message: 'Summary unsaved successfully',
                    save: false,
                });
            default:
                return res.status(400).json({ message: 'Save condition is required' });
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.saveUnsaveSummary = saveUnsaveSummary;
// Remove Summary
const remove_summary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { summary_id } = req.params;
    const { id } = req.user;
    try {
        let isCaptain = false;
        // Find the summary to be removed
        const findSummary = yield summary_models_1.default.findById(summary_id);
        if (!findSummary) {
            return res.status(404).json({ message: 'Summary not found' });
        }
        // Find the routine to check permission
        const routine = yield routine_models_1.default.findOne({ _id: findSummary.routineId });
        if (!routine) {
            return res.status(404).json({ message: "Routine not found" });
        }
        // Check if the user is a captain
        const isCaptainFind = yield routineMembers_Model_1.default.findOne({ memberID: req.user.id, RutineID: findSummary.routineId, captain: true });
        if (isCaptainFind) {
            isCaptain = true;
        }
        // Only summary owner, routine owner, or captains can delete
        const deletePermission = findSummary.ownerId !== id || routine.ownerid == id || isCaptain;
        if (!deletePermission) {
            return res.status(403).json({ message: "You don't have permission to delete" });
        }
        // Step 1: Delete the summary from Firebase storage
        for (const imageLink of (_a = findSummary.imageLinks) !== null && _a !== void 0 ? _a : []) {
            const fileRef = ref(storage, imageLink);
            yield deleteObject(fileRef);
        }
        // Step 3: Delete associated save records
        yield save_summary_model_1.default.deleteMany({ summaryId: summary_id });
        // Step 2: Delete the summary from MongoDB
        yield summary_models_1.default.findByIdAndDelete(summary_id);
        return res.status(200).json({ message: "Summary deleted successfully" });
    }
    catch (error) {
        console.log('From delete summary');
        console.log(error);
        return res.status(400).json({ message: error.message });
    }
});
exports.remove_summary = remove_summary;
