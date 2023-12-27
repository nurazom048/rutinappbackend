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
exports.deleteSummariesFromFirebaseBaseOnRoutineID = exports.deleteSummariesFromFirebaseBaseOnClassId = exports.summaryImageUploader = void 0;
//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_Storage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_Storage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();
//models
const summary_models_1 = __importDefault(require("../models/summary.models"));
const save_summary_model_1 = __importDefault(require("../models/save_summary.model"));
// Upload summary's to Firebase Storage
const summaryImageUploader = ({ files, class_id, routineID }) => __awaiter(void 0, void 0, void 0, function* () {
    const downloadUrls = [];
    const newImageFileNames = [];
    const timestamp = Date.now();
    for (let i = 0; i < files.length; i++) {
        const filename = `${timestamp}-${i}-${files[i].originalname}`;
        newImageFileNames.push(filename);
        const fileRef = ref(storage, `summary/routineID-${routineID}/classID-${class_id}/files/${filename}`);
        const metadata = { contentType: files[i].mimetype };
        yield uploadBytes(fileRef, files[i].buffer, metadata);
    }
    for (let i = 0; i < newImageFileNames.length; i++) {
        const fileRef = ref(storage, `summary/routineID-${routineID}/classID-${class_id}/files/${newImageFileNames[i]}`);
        try {
            const url = yield getDownloadURL(fileRef);
            downloadUrls.push(url);
        }
        catch (error) {
            console.log(error);
            downloadUrls.push('');
        }
    }
    return downloadUrls;
});
exports.summaryImageUploader = summaryImageUploader;
// delete summary's from firebase
// export const deleteSummariesFromFirebase = async (summaries: any[]) => {
//     console.log(summaries)
//     for (let i = 0; i < summaries.length; i++) {
//         const summary = summaries[i];
//         // Delete files from Firebase Storage
// for (const imageLink of summary.imageLinks) {
//     const fileRef = ref(storage, imageLink);
//     const d = await deleteObject(fileRef);
//     console.log(d)
// }
//         // Delete the summary from MongoDB
//         const m = await Summary.findByIdAndDelete(summary._id);
//         console.log(m)
//     }
// };
const deleteSummariesFromFirebaseBaseOnClassId = (classId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        //delete all save summary
        yield save_summary_model_1.default.deleteMany({ classID: classId });
        const summariesToDelete = yield summary_models_1.default.find({ classId: classId });
        const summariesToDeleteLength = summariesToDelete.length;
        for (let i = 0; i < summariesToDeleteLength; i++) {
            // Delete the summary from MongoDB
            yield summary_models_1.default.findByIdAndDelete(summariesToDelete[i].id);
            // Delete images from Firebase Storage
            for (const imageLink of (_a = summariesToDelete[i].imageLinks) !== null && _a !== void 0 ? _a : []) {
                const fileRef = ref(storage, imageLink);
                yield deleteObject(fileRef);
                console.log("Deleted image from Firebase:", imageLink);
            }
        }
        console.log("Deletion completed successfully!");
    }
    catch (error) {
        console.error("Error deleting summaries:", error);
    }
});
exports.deleteSummariesFromFirebaseBaseOnClassId = deleteSummariesFromFirebaseBaseOnClassId;
// delete Summary base on Routine
const deleteSummariesFromFirebaseBaseOnRoutineID = (routineID) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        //delete all save summary
        yield save_summary_model_1.default.deleteMany({ routineId: routineID });
        //
        const summariesToDelete = yield summary_models_1.default.find({ routineId: routineID });
        const summariesToDeleteLength = summariesToDelete.length;
        for (let i = 0; i < summariesToDeleteLength; i++) {
            // Delete the summary from MongoDB
            yield summary_models_1.default.findByIdAndDelete(summariesToDelete[i].id);
            // Delete images from Firebase Storage
            for (const imageLink of (_b = summariesToDelete[i].imageLinks) !== null && _b !== void 0 ? _b : []) {
                const fileRef = ref(storage, imageLink);
                yield deleteObject(fileRef);
                console.log("Deleted image from Firebase:", imageLink);
            }
        }
        console.log("Deletion completed successfully!");
    }
    catch (error) {
        console.error("Error deleting summaries:", error);
    }
});
exports.deleteSummariesFromFirebaseBaseOnRoutineID = deleteSummariesFromFirebaseBaseOnRoutineID;
