
//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_Storage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_Storage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();

//models
const Summary = require('../../../models/Routines Models/save_summary.model')


// Upload summary's to Firebase Storage
export const summaryImageUploader = async ({ files, class_id }: { files: any[], class_id: string }) => {
    const downloadUrls = [];
    const newImageFileNames = [];
    const timestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
        const filename = `${timestamp}-${i}-${files[i].originalname}`;
        newImageFileNames.push(filename);

        const fileRef = ref(storage, `summary/classID-${class_id}/files/${filename}`);
        const metadata = { contentType: files[i].mimetype };
        await uploadBytes(fileRef, files[i].buffer, metadata);
    }

    for (let i = 0; i < newImageFileNames.length; i++) {
        const fileRef = ref(storage, `summary/classID-${class_id}/files/${newImageFileNames[i]}`);
        try {
            const url = await getDownloadURL(fileRef);
            downloadUrls.push(url);
        } catch (error) {
            console.log(error);
            downloadUrls.push('');
        }
    }

    return downloadUrls;
};
// delete summary's from firebase
export const deleteSummariesFromFirebase = async (summaries: any[]) => {
    for (let i = 0; i < summaries.length; i++) {
        const summary = summaries[i];

        // Delete files from Firebase Storage
        for (const imageLink of summary.imageLinks) {
            const fileRef = ref(storage, imageLink);
            await deleteObject(fileRef);
        }

        // Delete the summary from MongoDB
        await Summary.findByIdAndDelete(summary._id);
    }
};