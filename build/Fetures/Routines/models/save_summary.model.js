"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb_connection_1 = require("../../../connection/mongodb.connection");
const saveSummarySchema = new mongoose_1.Schema({
    summaryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Summary',
        required: true,
    },
    routineId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Routine',
    },
    classID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Class',
    },
    savedByAccountId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
});
const SaveSummary = mongodb_connection_1.RoutineDB.model('SaveSummary', saveSummarySchema);
exports.default = SaveSummary;
