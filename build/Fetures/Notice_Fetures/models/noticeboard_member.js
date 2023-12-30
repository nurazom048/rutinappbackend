"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb_connection_1 = require("../../../connection/mongodb.connection");
const NoticeBoardMemberSchema = new mongoose_1.Schema({
    academyID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    notificationOn: {
        type: Boolean,
        default: false,
    },
    memberID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
});
exports.default = mongodb_connection_1.NoticeDB.model('NoticeBoardMember', NoticeBoardMemberSchema);
