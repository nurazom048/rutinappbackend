const mongoose = require('mongoose');
const noticeSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    content: [{

        content_name: { type: String, required: true },
        pdf: { type: String },
        description: { type: String },
        time: {
            type: Date,
            required: true,
            default: Date.now
        },
    }],
    pined_notice: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
    }],
    saved_routines: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
    }],
});

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
