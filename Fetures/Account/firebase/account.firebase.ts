// Import necessary Firebase Storage functions
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firebaseConfig } from "../../../config/firebase/firebase_storage";
const storage = getStorage();

// Initialize Firebase
initializeApp(firebaseConfig);
