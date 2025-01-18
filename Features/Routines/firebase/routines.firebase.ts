//! firebase
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
// import { firebaseConfig } from "../../../config/firebase/firebase_storage";
import { firebaseConfig } from "../../../config/firebase/firebase_storage";
initializeApp(firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();


//@deleteRoutineMediaFolder
export const deleteRoutineMediaFolder = async (routineID: string) => {
    try {
        // Define the folder path to delete
        const folderRef = ref(storage, `summary/routineID-${routineID}`);

        // List all items (files and folders) in the folder
        const folderContents = await listAll(folderRef);

        // Loop through each file and delete it
        const deletePromises = folderContents.items.map((fileRef) => deleteObject(fileRef));

        // Wait for all delete operations to complete
        await Promise.all(deletePromises);

        console.log(`All files in routineID-${routineID} deleted successfully.`);
    } catch (error) {
        console.error("Error deleting media files:", error);
    }
};


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
