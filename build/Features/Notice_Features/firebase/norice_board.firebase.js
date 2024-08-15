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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToFirebaseAndGetDownloadUrl = void 0;
const utils_1 = require("../../../utils/utils");
//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const firebase_stroage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_stroage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();
//*** Method to upload a file to Firebase Storage and return the download URL  *****  */
const uploadFileToFirebaseAndGetDownloadUrl = (uuid, accountId, file) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const originalFilename = file.originalname;
        const mimetype = file.mimetype;
        const filename = `${accountId}-${uuid}-${originalFilename}`;
        const metadata = { contentType: mimetype };
        const storage = getStorage(); // Get a reference to the Firebase Storage bucket
        const pdfRef = ref(storage, `notice/academyId-${accountId}/pdf/${filename}`); // Create a reference to the bucket
        yield uploadBytes(pdfRef, file.buffer, metadata);
        const pdfUrl = yield getDownloadURL(pdfRef);
        return pdfUrl;
    }
    catch (error) {
        (0, utils_1.printError)('Error uploading file to Firebase:' + error);
        throw error;
    }
});
exports.uploadFileToFirebaseAndGetDownloadUrl = uploadFileToFirebaseAndGetDownloadUrl;
