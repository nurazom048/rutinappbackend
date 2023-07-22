
import mongoose, { Document, Schema, Model } from 'mongoose';

interface ISaveSummary extends Document {
  summaryId: mongoose.Types.ObjectId;
  routineId?: mongoose.Types.ObjectId;
  classID?: mongoose.Types.ObjectId;
  savedByAccountId: mongoose.Types.ObjectId;
}

const saveSummarySchema: Schema<ISaveSummary> = new Schema<ISaveSummary>({
  summaryId: {
    type: Schema.Types.ObjectId,
    ref: 'Summary',
    required: true,
  },
  routineId: {
    type: Schema.Types.ObjectId,
    ref: 'Routine',
  },
  classID: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
  },
  savedByAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
});

const SaveSummary: Model<ISaveSummary> = mongoose.model<ISaveSummary>('SaveSummary', saveSummarySchema);

export default SaveSummary;















// const mongoose = require('mongoose');

// const saveSummarySchema = new mongoose.Schema({
//     summaryId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Summary',
//         required: true,
//     },
//     routineId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Routine',
//     },
//     classID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Class',
//     },
//     savedByAccountId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Account',
//         required: true,
//     },
// });

// const SaveSummary = mongoose.model('SaveSummary', saveSummarySchema);

// module.exports = SaveSummary;
