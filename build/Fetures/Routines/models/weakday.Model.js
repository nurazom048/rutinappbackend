"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb_connection_1 = require("../../../connection/mongodb.connection");
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
const Weekday = mongodb_connection_1.RoutineDB.model('Weekday', weekdaySchema);
exports.default = Weekday;
