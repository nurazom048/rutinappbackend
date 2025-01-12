import mongoose, { Document, Schema, Model } from 'mongoose';
import { RoutineDB } from '../../../prisma/mongodb.connection';

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

const SaveRoutine: Model<ISaveRoutine> = RoutineDB.model<ISaveRoutine>('SaveRoutine', saveRoutineSchema);

export default SaveRoutine;
















