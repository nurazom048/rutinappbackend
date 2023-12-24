
import mongoose, { Document, Schema, Model } from 'mongoose';
import { RoutineDB } from '../../../connection/mongodb.connection';

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
    ref: 'Account',
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

export default Routine;







