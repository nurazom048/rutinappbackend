"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb_connection_1 = require("../../../connection/mongodb.connection");
const classScheme = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Routine Name is required'],
    },
    instuctor_name: {
        type: String,
        required: [true, 'instuctor_name is required'],
        default: '',
    },
    subjectcode: {
        type: String,
        required: [true, 'subjectcode is required'],
        default: '',
    },
    weekday: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Weekday',
            required: true,
        }],
    rutin_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
    },
});
const Class = mongodb_connection_1.RoutineDB.model('Class', classScheme);
exports.default = Class;
