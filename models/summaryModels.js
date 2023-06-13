const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SummarySchema = new Schema({
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    text: {
        type: String,
        required: [true, 'text is required']
    },
    imageLinks: {
        type: [String]
    },
    routineId: {
        type: Schema.Types.ObjectId,
        ref: 'Routine',
        required: true
    },
    classId: {
        type: Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

});

const Summary = mongoose.model('Summary', SummarySchema);

module.exports = Summary;
