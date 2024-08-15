"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb_connection_1 = require("../../../connection/mongodb.connection");
const pendingAccountSchema = new mongoose_1.Schema({
    // accountId: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'Account',
    // },
    isAccept: {
        type: Boolean,
        default: false,
    },
    email: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    EIIN: {
        type: String,
        required: true,
        unique: true,
    },
    address: String,
    name: String,
    about: String,
    contractInfo: String,
    phone: String,
    image: String,
    coverImage: String,
    sendTime: {
        type: Date,
        required: true,
        default: Date.now,
    },
    password: String,
    account_type: {
        type: String,
        enum: ["user" /* AccountType.User */, "student" /* AccountType.Student */, "academy" /* AccountType.Academy */],
        required: true,
        default: "user" /* AccountType.User */,
    },
    googleSignIn: {
        type: Boolean,
        require: true,
        default: false,
    },
});
const PendingAccount = mongodb_connection_1.maineDB.model('PendingAccount', pendingAccountSchema);
exports.default = PendingAccount;
