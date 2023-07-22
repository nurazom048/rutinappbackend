"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
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
const Notification = mongoose_1.default.model('Notification', notificationSchema);
exports.default = Notification;
// const mongoose = require('mongoose');
// const notificationSchema = new mongoose.Schema({
//     accountID: {
//         type: String,
//     },
//     title: {
//         type: String,
//         required: true,
//     },
//     body: {
//         type: String,
//     },
//     imageUrl: {
//         type: String,
//     },
//     rutineID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Routine',
//     },
//     NoticeID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Notice',
//     },
//     type: {
//         type: String,
//         enum: ['public', 'private'],
//         required: true,
//         default: 'public',
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     },
// });
// const Notification = mongoose.model('Notification', notificationSchema);
// module.exports = Notification;
