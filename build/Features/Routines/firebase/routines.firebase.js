"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//! firebase
const app_1 = require("firebase/app");
const storage_1 = require("firebase/storage");
// import { firebaseConfig } from "../../../config/firebase/firebase_storage";
const firebase_storage_1 = require("../../../config/firebase/firebase_storage");
(0, app_1.initializeApp)(firebase_storage_1.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = (0, storage_1.getStorage)();
