import mongoose, { Document, Schema, Model } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { RoutineDB } from '../../../connection/mongodb.connection';

interface IPriodeModel extends Document {
    priode_number: number;
    start_time: Date;
    end_time: Date;
    rutin_id: mongoose.Types.ObjectId;
}

const priodeModelSchema: Schema<IPriodeModel> = new Schema<IPriodeModel>({
    priode_number: {
        type: Number,
        required: [true, 'Please provide a period number'],
    },
    start_time: {
        type: Date,
        required: [true, 'Start Time is required'],
    },
    end_time: {
        type: Date,
        required: [true, 'end_time is required'],
    },
    rutin_id: {
        type: Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
    },
});

const PriodeModel: Model<IPriodeModel> = RoutineDB.model<IPriodeModel>('priodeModel', priodeModelSchema);



export default PriodeModel;
















