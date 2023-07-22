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
const weekdaySchema = new mongoose_1.Schema({
    routine_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
    },
    class_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Class',
        required: [true, 'Class ID is required'],
    },
    room: {
        type: String,
        required: [true, 'room is required'],
        default: '',
    },
    num: {
        type: Number,
        required: [true, 'Weekday number is required'],
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
    start: {
        type: Number,
        required: [true, 'Start period is required'],
    },
    end: {
        type: Number,
        required: [true, 'End period is required']
    },
});
const Weekday = mongoose_1.default.model('Weekday', weekdaySchema);
exports.default = Weekday;
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// // Define weekday schema
// const weekdaySchema = new mongoose.Schema({
//     routine_id: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Routine',
//         required: true,
//     },
//     class_id: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Class',
//         required: [true, 'Class ID is required']
//     },
//     room: {
//         type: String,
//         required: [true, 'room is required'],
//         default: ""
//     },
//     num: {
//         type: Number,
//         required: [true, 'Weekday number is required'],
//         enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
//     },
//     start: {
//         type: Number,
//         required: [true, 'Start period is required'],
//         validate: {
//             validator: function (value) {
//                 return value <= this.end && value !== 0;
//             },
//             message: 'Start period should be less than End period and cannot be zero'
//         }
//     },
//     end: {
//         type: Number,
//         required: [true, 'End period is required'],
//         validate: {
//             validator: function (value) {
//                 return value !== 0;
//             },
//             message: 'End period cannot be zero'
//         }
//     }
// });
// // Create weekday model from schema
// const Weekday = mongoose.model('Weekday', weekdaySchema);
// // Export weekday model
// module.exports = Weekday;
