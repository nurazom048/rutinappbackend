"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb_connection_1 = require("../../connection/mongodb.connection");
const priodeModelSchema = new mongoose_1.Schema({
    priode_number: {
        type: Number,
        required: [true, 'Please provide a period number'],
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
const PriodeModel = mongodb_connection_1.RoutineDB.model('priodModel', priodeModelSchema);
exports.default = PriodeModel;
