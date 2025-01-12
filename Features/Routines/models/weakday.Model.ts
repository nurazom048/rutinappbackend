import mongoose, { Document, Schema, Model } from 'mongoose';
import { RoutineDB } from '../../../prisma/mongodb.connection';

interface IWeekday extends Document {
    routine_id: mongoose.Types.ObjectId;
    class_id: mongoose.Types.ObjectId;
    room: string;
    num: number;
    start_time: Date;
    end_time: Date;
    start_time_2: Date;
    end_time_2: Date;
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
    start_time: {
        type: Date,
        required: [true, 'Start Time is required'],
    },
    end_time: {
        type: Date,
        required: [true, 'end_time is required'],
    },
    //------ For Same class on second Shift -------- //
    start_time_2: {
        type: Date,
        // required: [true, 'Start Time is required'],
    },
    end_time_2: {
        type: Date,
        /// required: [true, 'end_time is required'],
    },
});

const Weekday: Model<IWeekday> = RoutineDB.model<IWeekday>('Weekday', weekdaySchema);

export default Weekday;
