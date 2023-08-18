"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb_connection_1 = require("../../connection/mongodb.connection");
const summarySchema = new mongoose_1.Schema({
    ownerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    text: {
        type: String,
        required: [true, 'text is required'],
    },
    imageLinks: [String],
    routineId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
    },
    classId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
const Summary = mongodb_connection_1.RoutineDB.model('Summary', summarySchema);
exports.default = Summary;
