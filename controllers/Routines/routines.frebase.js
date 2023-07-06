
//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, deleteObject } = require('firebase/storage');
const firebase_stroage = require("../../config/firebase_stroges");
initializeApp(firebase_stroage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();

//models
const Summary = require('../../models/summaryModels')

// delete summary's from firebase
exports.deleteSummariesFromFirebase = async (summaries) => {
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
