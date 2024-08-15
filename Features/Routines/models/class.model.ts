import mongoose, { Document, Schema, Model } from 'mongoose';
import { RoutineDB } from '../../../connection/mongodb.connection';

interface IClass extends Document {
  name: string;
  instuctor_name: string;
  subjectcode: string;
  weekday: mongoose.Types.ObjectId[];
  routine_id: mongoose.Types.ObjectId;
}

const classScheme: Schema<IClass> = new Schema<IClass>({
  name: {
    type: String,
    required: [true, 'Routine Name is required'],
  },
  instuctor_name: {
    type: String,
    required: [true, 'instuctor_name is required'],
    default: '',
  },
  subjectcode: {
    type: String,
    required: [true, 'subjectcode is required'],
    default: '',
  },
  weekday: [{
    type: Schema.Types.ObjectId,
    ref: 'Weekday',
    required: true,
  }],
  routine_id: {
    type: Schema.Types.ObjectId,
    ref: 'Routine',
    required: true,
  },
});

const Class: Model<IClass> = RoutineDB.model<IClass>('Class', classScheme);

export default Class;










