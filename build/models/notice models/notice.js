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
const uuid_1 = require("uuid");
const NoticeSchema = new mongoose_1.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    content_name: {
        type: String,
        required: [true, 'The content_name field is required.'],
    },
    pdf: String,
    description: String,
    time: {
        type: Date,
        required: [true, 'The time field is required.'],
        default: Date.now,
    },
    academyID: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Account',
    },
    rutineID: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Routine',
    },
});
const NoticeModel = mongoose_1.default.model('Notice', NoticeSchema);
exports.default = NoticeModel;
// const mongoose = require('mongoose');
// const { v4: uuidv4 } = require('uuid');
// const NoticeSchema = new mongoose.Schema({
//     _id: {
//         type: String,
//         default: uuidv4, // Generate a unique UUID as the default value
//     },
//     content_name: {
//         type: String,
//         required: [true, 'The content_name field is required.'],
//     },
//     pdf: String,
//     description: String,
//     time: {
//         type: Date,
//         required: [true, 'The time field is required.'],
//         default: Date.now,
//     },
//     academyID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Account',
//     },
//     rutineID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Routine',
//     },
// });
// const NoticeMoel = mongoose.model('Notice', NoticeSchema);
// module.exports = NoticeMoel;
