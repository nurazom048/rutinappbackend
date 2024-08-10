"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb_connection_1 = require("../../../connection/mongodb.connection");
var NotificationType;
(function (NotificationType) {
    NotificationType["Public"] = "public";
    NotificationType["Private"] = "private";
})(NotificationType || (NotificationType = {}));
const notificationSchema = new mongoose_1.Schema({
    accountID: {
        type: String,
    },
    title: {
        type: String,
        required: true,
    },
    body: String,
    imageUrl: String,
    routineID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Routine',
    },
    NoticeID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Notice',
    },
    type: {
        type: String,
        enum: [NotificationType.Public, NotificationType.Private],
        required: true,
        default: NotificationType.Public,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
const Notification = mongodb_connection_1.NotificationDB.model('Notification', notificationSchema);
exports.default = Notification;
