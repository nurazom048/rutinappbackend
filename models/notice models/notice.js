const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
    content_name: {
        type: String,
        required: [true, 'The content_name field is required.'],
    },
    pdf: [{
        url: String,

    }],
    description: String,
    time: {
        type: Date,
        required: [true, 'The time field is required.'],
        default: Date.now,
    },


    noticeBoard: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NoticeBord',
        required: true,
    },
    visibility: {
        type: String,
        enum: ['public', 'members'],
        default: 'public',
        required: true,
    },
});

const NoticeMoel = mongoose.model('Notice', NoticeSchema);

module.exports = NoticeMoel;
