
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NoticeBoardMemberSchema = new Schema({
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

const NoticeBoardMember = mongoose.model(
    'NoticeBoardMember',
    NoticeBoardMemberSchema
);

module.exports = NoticeBoardMember;
