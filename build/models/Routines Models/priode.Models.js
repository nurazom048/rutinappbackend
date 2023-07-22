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
const priodeModelSchema = new mongoose_1.Schema({
    priode_number: {
        type: Number,
        required: [true, 'Please provide a period number'],
        default: 1,
    },
    start_time: {
        type: Date,
        required: [true, 'Start Time is required'],
    },
    end_time: {
        type: Date,
        required: [true, 'end_time is required'],
    },
    rutin_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
    },
});
const PriodeModel = mongoose_1.default.model('priodModel', priodeModelSchema);
exports.default = PriodeModel;
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const priodModelSchema = new Schema({
//     priode_number: {
//         type: Number,
//         required: [true, 'Please provide a period number'],
//         default: 1,
//         validate: {
//             validator: function (v) {
//                 return v > 0;
//             },
//             message: 'Period number must be greater than zero'
//         }
//     },
//     start_time: {
//         type: Date,
//         required: [true, 'Start Time is required '],
//     },
//     end_time: {
//         type: Date,
//         required: [true, 'end_time is required'],
//     },
//     rutin_id: {
//         type: Schema.Types.ObjectId,
//         ref: 'Routine',
//         required: true,
//     },
// });
// const priodModel = mongoose.model('priodModel', priodModelSchema);
// module.exports = priodModel;
