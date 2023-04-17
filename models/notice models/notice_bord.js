const mongoose = require('mongoose');

const NoticeBordSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'The name field is required.'],
    },
    description: String,
    notices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notice',
    }],
    member: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
    }],
    joinRequest: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
    }],
    pined_notice: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
    }],
});

const NoticeBordModel = mongoose.model('NoticeBord', NoticeBordSchema);

module.exports = NoticeBordModel;
