const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    accountID: {
        type: String,
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
    },
    rutineID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Routine',
    },
    NoticeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notice',
    },
    type: {
        type: String,
        enum: ['public', 'private'],
        required: true,
        default: 'public',
    },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
