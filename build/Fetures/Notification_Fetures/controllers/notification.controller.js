"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllNotifications = exports.deleteNotification = exports.createNotification = void 0;
const app_1 = require("firebase/app");
const storage_1 = require("firebase/storage");
const firebase_storage_1 = require("../../../config/firebase/firebase_storage"); // Replace with the actual path to your firebaseConfig file
const notification_model_1 = __importDefault(require("../models/notification.model"));
// Initialize Firebase
(0, app_1.initializeApp)(firebase_storage_1.firebaseConfig);
const storage = (0, storage_1.getStorage)();
// Create a notification
const createNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    try {
        // Retrieve data from the request body
        const { accountID, title, body, rutineID, routineID, NoticeID, type } = req.body;
        const image = req.file;
        // Validate required fields
        if (!title || !body || !type) {
            return res.status(400).json({ message: 'Please fill in all the required fields' });
        }
        let imageUrl;
        if (image) {
            // Upload the image to Firebase
            const timestamp = Date.now();
            const filename = `${accountID}-${timestamp}-${image.originalname}`;
            const metadata = { contentType: image.mimetype };
            const imageRef = (0, storage_1.ref)(storage, `images/notification/${type}/${filename}`);
            yield (0, storage_1.uploadBytes)(imageRef, image.buffer, metadata);
            imageUrl = yield (0, storage_1.getDownloadURL)(imageRef);
        }
        // Create a new notification
        const notification = new notification_model_1.default({
            accountID,
            title,
            body,
            imageUrl,
            rutineID,
            NoticeID,
            type,
        });
        // Save the notification to the database
        const savedNotification = yield notification.save();
        res.status(200).json({ message: 'Notification created successfully', notification: savedNotification });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create notification', error: error.message });
    }
});
exports.createNotification = createNotification;
// Delete a notification by ID
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId } = req.params;
        // Find the notification by ID
        const notification = yield notification_model_1.default.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        // Delete the notification from Firebase storage
        if (notification.imageUrl) {
            const imageRef = (0, storage_1.ref)(storage, notification.imageUrl);
            yield (0, storage_1.deleteObject)(imageRef);
        }
        // Remove the notification from the database
        yield notification.deleteOne();
        res.status(200).json({ message: 'Notification deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete notification', error: error.message });
    }
});
exports.deleteNotification = deleteNotification;
// Get all notifications and sort by creation date
const getAllNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Adjust the limit as per your requirements
    try {
        const totalCount = yield notification_model_1.default.countDocuments();
        const totalPages = Math.ceil(totalCount / limit);
        const notifications = yield notification_model_1.default.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        res.status(200).json({
            notifications,
            currentPage: page,
            totalPages,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get notifications', error: error.message });
    }
});
exports.getAllNotifications = getAllNotifications;
