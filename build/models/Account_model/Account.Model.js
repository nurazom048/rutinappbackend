"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb_connection_1 = require("../../connection/mongodb.connection");
const accountSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    name: String,
    about: String,
    email: {
        type: String,
        unique: true,
    },
    phone: {
        type: String,
        required: false,
    },
    image: String,
    coverImage: String,
    Saved_routines: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Routine',
        }],
    password: String,
    osUserID: String,
    account_type: {
        type: String,
        enum: ["user" /* AccountType.User */, "student" /* AccountType.Student */, "academy" /* AccountType.Academy */],
        required: true,
        default: "user" /* AccountType.User */,
    },
    routines: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Routine',
        }],
    googleSignIn: {
        type: Boolean,
        require: true,
        default: false,
    },
    lastLoginTime: Date,
});
mongodb_connection_1.maineDB.model('Account', accountSchema);
const Account = mongodb_connection_1.maineDB.model('Account', accountSchema);
exports.default = Account;
