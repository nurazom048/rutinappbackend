const mongoose = require('mongoose');

const saveRoutineSchema = new mongoose.Schema({

    routineID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
    },
    savedByAccountID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
});

const SaveSummary = mongoose.model('SaveRoutine', saveRoutineSchema);

module.exports = SaveSummary;
