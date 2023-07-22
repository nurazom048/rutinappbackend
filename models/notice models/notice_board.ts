
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
// const NoticeBordSchema = new mongoose.Schema({
//     owner: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Account',
//         required: true,
//     },
//     name: {
//         type: String,
//         required: [true, 'The name field is required.'],
//     },
//     description: String,
//     notices: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Notice',
//     }],
//     member: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Account',
//     }],
//     joinRequest: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Account',
//     }],
//     pined_notice: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Account',
//     }],
//     notificationOn: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Account',
//     }],
// });

// const NoticeBordModel = mongoose.model('NoticeBord', NoticeBordSchema);

// module.exports = NoticeBordModel;
