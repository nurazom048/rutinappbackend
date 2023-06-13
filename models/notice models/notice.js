const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const NoticeSchema = new mongoose.Schema({

    _id: {
        type: String,
        default: uuidv4, // Generate a unique UUID as the default value
    },
    content_name: {
        type: String,
        required: [true, 'The content_name field is required.'],
    },
    pdf: String,
    description: String,
    time: {
        type: Date,
        required: [true, 'The time field is required.'],
        default: Date.now,
    },


    academyID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
    },

    rutineID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Routine',
    },

});

const NoticeMoel = mongoose.model('Notice', NoticeSchema);
module.exports = NoticeMoel;
