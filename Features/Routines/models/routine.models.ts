import mongoose, { Document, Schema, Model } from 'mongoose';
import { maineDB, RoutineDB } from '../../../prisma/mongodb.connection';

interface IRoutine extends Document {
  name: string;
  ownerid: mongoose.Types.ObjectId;
  cap10s: mongoose.Types.ObjectId[];
  send_request: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  notificationOff: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const routineSchema: Schema<IRoutine> = new Schema<IRoutine>({
  name: {
    type: String,
    required: true,
  },
  ownerid: {
    type: Schema.Types.ObjectId,
    ref: 'Account', // Assuming 'Account' is the name you used for the 'Account' model
    required: true,
  },
  cap10s: [{
    type: Schema.Types.ObjectId,
    ref: 'Account',
  }],
  send_request: [{
    type: Schema.Types.ObjectId,
    ref: 'Account',
  }],
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'Account',
  }],
  notificationOff: [{
    type: Schema.Types.ObjectId,
    ref: 'Account',
  }],
}, { timestamps: true });

const Routine: Model<IRoutine> = RoutineDB.model<IRoutine>('Routine', routineSchema);
// Register the 'Routine' model with Mongoose
Routine; // Add this line to register the model

export default Routine;
