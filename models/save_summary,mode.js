const mongoose = require('mongoose');

const saveSummarySchema = new mongoose.Schema({
    summaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Summary',
        required: true,
    },
    routineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Routine',
    },
    savedByAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
});

const SaveSummary = mongoose.model('SaveSummary', saveSummarySchema);

module.exports = SaveSummary;
