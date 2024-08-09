"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb_connection_1 = require("../../../connection/mongodb.connection");
const routineSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    ownerid: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    cap10s: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Account',
        }],
    send_request: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Account',
        }],
    members: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Account',
        }],
    notificationOff: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Account',
        }],
}, { timestamps: true });
const Routine = mongodb_connection_1.RoutineDB.model('Routine', routineSchema);
// Register the 'Routine' model with Mongoose
Routine; // Add this line to register the model
exports.default = Routine;
