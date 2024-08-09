"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import necessary Firebase Storage functions
const app_1 = require("firebase/app");
const storage_1 = require("firebase/storage");
const firebase_storage_1 = require("../../../config/firebase/firebase_storage");
const storage = (0, storage_1.getStorage)();
// Initialize Firebase
(0, app_1.initializeApp)(firebase_storage_1.firebaseConfig);
