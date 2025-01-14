
//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_Storage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_Storage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();

import { ObjectId } from 'mongoose';
//models
import Summary from '../models/summary.models';
import SaveSummaries from '../models/save_summary.model';


// Upload summary's to Firebase Storage
export const summaryImageUploader = async ({ files, classId, routineID }: { files: any[], classId: string, routineID: any }) => {
    const downloadUrls = [];
    const newImageFileNames = [];
    const timestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
        const filename = `${timestamp}-${i}-${files[i].originalname}`;
        newImageFileNames.push(filename);

        const fileRef = ref(storage, `summary/routineID-${routineID}/classID-${classId}/files/${filename}`);
        const metadata = { contentType: files[i].mimetype };
        await uploadBytes(fileRef, files[i].buffer, metadata);
    }

    for (let i = 0; i < newImageFileNames.length; i++) {
        const fileRef = ref(storage, `summary/routineID-${routineID}/classID-${classId}/files/${newImageFileNames[i]}`);
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


export const deleteSummariesFromFirebaseBaseOnClassId = async (classId: ObjectId) => {


    try {
        //delete all save summary
        await SaveSummaries.deleteMany({ classID: classId });


        const summariesToDelete = await Summary.find({ classId: classId })
        const summariesToDeleteLength = summariesToDelete.length;

        for (let i = 0; i < summariesToDeleteLength; i++) {
            // Delete the summary from MongoDB
            await Summary.findByIdAndDelete(summariesToDelete[i].id);

            // Delete images from Firebase Storage
            for (const imageLink of summariesToDelete[i].imageLinks ?? []) {
                const fileRef = ref(storage, imageLink);
                await deleteObject(fileRef);
                console.log("Deleted image from Firebase:", imageLink);
            }
        }

        console.log("Deletion completed successfully!");
    } catch (error) {
        console.error("Error deleting summaries:", error);
    }




};

// delete Summary base on Routine

export const deleteSummariesFromFirebaseBaseOnRoutineID = async (routineID: string) => {
    try {

        //delete all save summary
        await SaveSummaries.deleteMany({ routineId: routineID });


        //
        const summariesToDelete = await Summary.find({ routineId: routineID });
        const summariesToDeleteLength = summariesToDelete.length;



        for (let i = 0; i < summariesToDeleteLength; i++) {
            // Delete the summary from MongoDB
            await Summary.findByIdAndDelete(summariesToDelete[i].id);

            // Delete images from Firebase Storage
            for (const imageLink of summariesToDelete[i].imageLinks ?? []) {
                const fileRef = ref(storage, imageLink);
                await deleteObject(fileRef);
                console.log("Deleted image from Firebase:", imageLink);
            }
        }

        console.log("Deletion completed successfully!");
    } catch (error) {
        console.error("Error deleting summaries:", error);
    }
};
