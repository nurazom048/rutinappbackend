
//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_stroage = require("../../config/firebase_stroges");
initializeApp(firebase_stroage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();

//models
const Summary = require('../../models/summaryModels')



// MEthode To delte summrys from firebse
// Function to delete summaries from MongoDB and Firebase Storage
exports.deleteSummariesFromFirebase = async (summaries) => {
    for (let i = 0; i < summaries.length; i++) {
        const summary = summaries[i];

        // Delete files from Firebase Storage
        for (let j = 0; j < summary.imageLinks.length; j++) {
            const fileRef = ref(storage, `summary/classID-${summary.classId}/files/${summary.imageLinks[j]}`);
            await deleteObject(fileRef);
        }

        // Delete the summary from MongoDB
        await Summary.findByIdAndDelete(summary._id);
    }
}