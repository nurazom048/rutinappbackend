"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb_connection_1 = require("../../connection/mongodb.connection");
const routineMemberSchema = new mongoose_1.Schema({
    memberID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    RutineID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
    },
    notificationOn: {
        type: Boolean,
        default: false,
    },
    captain: {
        type: Boolean,
        default: false,
    },
    owner: {
        type: Boolean,
        default: false,
    },
    isSaved: {
        type: Boolean,
        default: false,
    },
    blocklist: {
        type: Boolean,
        default: false,
    },
});
const RoutineMember = mongodb_connection_1.RoutineDB.model('RoutineMember', routineMemberSchema);
exports.default = RoutineMember;
