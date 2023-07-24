// imports
import { v4 as uuidv4 } from 'uuid';

//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const firebase_stroage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_stroage.firebaseConfig);// Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();



//*** Method to upload a file to Firebase Storage and return the download URL  *****  */

export const uploadFileToFirebaseAndGetDownloadUrl = async (
    uuid: string,
    accountId: string,
    file: Express.Multer.File,
): Promise<string> => {
    try {

        const originalFilename = file.originalname;
        const mimetype = file.mimetype;

        const filename = `${accountId}-${uuid}-${originalFilename}`;
        const metadata = { contentType: mimetype };
        const storage = getStorage(); // Get a reference to the Firebase Storage bucket
        const pdfRef = ref(storage, `notice/academyId-${accountId}/pdf/${filename}`); // Create a reference to the bucket
        await uploadBytes(pdfRef, file.buffer, metadata);
        const pdfUrl: string = await getDownloadURL(pdfRef);

        return pdfUrl;
    } catch (error) {
        console.error('Error uploading file to Firebase:', error);
        throw error;
    }
};
