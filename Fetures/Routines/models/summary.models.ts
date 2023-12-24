import mongoose, { Document, Schema, Model } from 'mongoose';
import { RoutineDB } from '../../../connection/mongodb.connection';

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

const Summary: Model<ISummary> = RoutineDB.model<ISummary>('Summary', summarySchema);

export default Summary;











