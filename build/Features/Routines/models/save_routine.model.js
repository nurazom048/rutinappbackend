"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb_connection_1 = require("../../../connection/mongodb.connection");
const saveRoutineSchema = new mongoose_1.Schema({
    routineID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
    },
    savedByAccountID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
});
const SaveRoutine = mongodb_connection_1.RoutineDB.model('SaveRoutine', saveRoutineSchema);
exports.default = SaveRoutine;
