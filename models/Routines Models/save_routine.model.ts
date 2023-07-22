import mongoose, { Document, Schema, Model } from 'mongoose';

interface ISaveRoutine extends Document {
  routineID: mongoose.Types.ObjectId;
  savedByAccountID: mongoose.Types.ObjectId;
}

const saveRoutineSchema: Schema<ISaveRoutine> = new Schema<ISaveRoutine>({
  routineID: {
    type: Schema.Types.ObjectId,
    ref: 'Routine',
    required: true,
  },
  savedByAccountID: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
});

const SaveRoutine: Model<ISaveRoutine> = mongoose.model<ISaveRoutine>('SaveRoutine', saveRoutineSchema);

export default SaveRoutine;



















// const mongoose = require('mongoose');

// const saveRoutineSchema = new mongoose.Schema({

//     routineID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Routine',
//         required: true,
//     },
//     savedByAccountID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Account',
//         required: true,
//     },
// });

// const SaveSummary = mongoose.model('SaveRoutine', saveRoutineSchema);

// module.exports = SaveSummary;
