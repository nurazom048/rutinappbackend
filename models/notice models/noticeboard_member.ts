import mongoose, { Document, Schema, Model } from 'mongoose';

interface INoticeBoardMember extends Document {
    academyID: mongoose.Types.ObjectId;
    notificationOn: boolean;
    memberID: mongoose.Types.ObjectId;
}

const NoticeBoardMemberSchema: Schema<INoticeBoardMember> = new Schema<INoticeBoardMember>({
    academyID: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    notificationOn: {
        type: Boolean,
        default: false,
    },
    memberID: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
});

const NoticeBoardMember: Model<INoticeBoardMember> = mongoose.model<INoticeBoardMember>(
    'NoticeBoardMember',
    NoticeBoardMemberSchema
);

export default NoticeBoardMember;

// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const NoticeBoardMemberSchema = new Schema({
//     academyID: {
//         type: Schema.Types.ObjectId,
//         ref: 'Account',
//         required: true,
//     },
//     notificationOn: {
//         type: Boolean,
//         default: false,
//     },
//     memberID: {
//         type: Schema.Types.ObjectId,
//         ref: 'Account',
//         required: true,
//     },
// });

// const NoticeBoardMember = mongoose.model(
//     'NoticeBoardMember',
//     NoticeBoardMemberSchema
// );

// module.exports = NoticeBoardMember;
