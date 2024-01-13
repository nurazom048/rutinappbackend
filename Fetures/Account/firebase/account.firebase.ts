// Import necessary Firebase Storage functions
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firebaseConfig } from "../../../config/firebase/firebase_storage";
const storage = getStorage();

// Initialize Firebase
initializeApp(firebaseConfig);

// Check if the file exists in Firebase Storage
export async function doesFileExist(downloadUrl: string): Promise<boolean> {
    try {
        // Extract the path from the download URL
        const path = new URL(downloadUrl).pathname;

        // Check if the file exists in Firebase Storage
        const fileRef = ref(storage, path);
        await getDownloadURL(fileRef);

        // If the URL is retrieved without errors, the file exists
        return true;
    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            // The object was not found, indicating that the file does not exist
            return false;
        } else {
            console.error('Error checking file existence:', error);
            return false;
        }
    }
}