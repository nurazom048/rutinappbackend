import mongoose, { Document, Schema, Model } from 'mongoose';

interface ISummary extends Document {
  ownerId: mongoose.Types.ObjectId;
  text: string;
  imageLinks?: string[];
  routineId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const summarySchema: Schema<ISummary> = new Schema<ISummary>({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  text: {
    type: String,
    required: [true, 'text is required'],
  },
  imageLinks: [String],
  routineId: {
    type: Schema.Types.ObjectId,
    ref: 'Routine',
    required: true,
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Summary: Model<ISummary> = mongoose.model<ISummary>('Summary', summarySchema);

export default Summary;















// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const SummarySchema = new Schema({
//     ownerId: {
//         type: Schema.Types.ObjectId,
//         ref: 'Account',
//         required: true
//     },
//     text: {
//         type: String,
//         required: [true, 'text is required']
//     },
//     imageLinks: {
//         type: [String]
//     },
//     routineId: {
//         type: Schema.Types.ObjectId,
//         ref: 'Routine',
//         required: true
//     },
//     classId: {
//         type: Schema.Types.ObjectId,
//         ref: 'Class',
//         required: true
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }

// });

// const Summary = mongoose.model('Summary', SummarySchema);

// module.exports = Summary;
