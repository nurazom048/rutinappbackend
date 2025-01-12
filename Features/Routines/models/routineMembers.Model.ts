import mongoose, { Document, Schema, Model } from 'mongoose';
import { RoutineDB } from '../../../prisma/mongodb.connection';


interface IRoutineMember extends Document {
  memberID: mongoose.Types.ObjectId;
  RutineID: mongoose.Types.ObjectId;
  notificationOn: boolean;
  captain: boolean;
  owner: boolean;
  isSaved: boolean;
  blocklist: boolean;
}

const routineMemberSchema: Schema<IRoutineMember> = new Schema<IRoutineMember>({
  memberID: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  RutineID: {
    type: Schema.Types.ObjectId,
    ref: 'Routine',
    required: true,
  },
  notificationOn: {
    type: Boolean,
    default: false,
  },
  captain: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: Boolean,
    default: false,
  },
  isSaved: {
    type: Boolean,
    default: false,
  },
  blocklist: {
    type: Boolean,
    default: false,
  },
});

const RoutineMember: Model<IRoutineMember> = RoutineDB.model<IRoutineMember>('RoutineMember', routineMemberSchema);

export default RoutineMember;
