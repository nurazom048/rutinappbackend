import mongoose, { Document, Schema, Model } from 'mongoose';
import { RoutineDB } from '../../connection/mongodb.connection';

interface IWeekday extends Document {
    routine_id: mongoose.Types.ObjectId;
    class_id: mongoose.Types.ObjectId;
    room: string;
    num: number;
    start: number;
    end: number;
}

const weekdaySchema: Schema<IWeekday> = new Schema<IWeekday>({
    routine_id: {
        type: Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
    },
    class_id: {
        type: Schema.Types.ObjectId,
        ref: 'Class',
        required: [true, 'Class ID is required'],
    },
    room: {
        type: String,
        required: [true, 'room is required'],
        default: '',
    },
    num: {
        type: Number,
        required: [true, 'Weekday number is required'],
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
    start: {
        type: Number,
        required: [true, 'Start period is required'],
    },
    end: {
        type: Number,
        required: [true, 'End period is required']
    },
});

const Weekday: Model<IWeekday> = RoutineDB.model<IWeekday>('Weekday', weekdaySchema);

export default Weekday;
