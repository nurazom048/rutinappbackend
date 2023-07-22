
import mongoose, { Document, Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface INotice extends Document {
    _id: string;
    content_name: string;
    pdf?: string;
    description?: string;
    time: Date;
    academyID?: mongoose.Schema.Types.ObjectId;
    rutineID?: mongoose.Schema.Types.ObjectId;
}

const NoticeSchema: Schema<INotice> = new Schema<INotice>({
    _id: {
        type: String,
        default: uuidv4,
    },
    content_name: {
        type: String,
        required: [true, 'The content_name field is required.'],
    },
    pdf: String,
    description: String,
    time: {
        type: Date,
        required: [true, 'The time field is required.'],
        default: Date.now,
    },
    academyID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
    },
    rutineID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Routine',
    },
});

const NoticeModel: Model<INotice> = mongoose.model<INotice>('Notice', NoticeSchema);

export default NoticeModel;















// const mongoose = require('mongoose');
// const { v4: uuidv4 } = require('uuid');

// const NoticeSchema = new mongoose.Schema({

//     _id: {
//         type: String,
//         default: uuidv4, // Generate a unique UUID as the default value
//     },
//     content_name: {
//         type: String,
//         required: [true, 'The content_name field is required.'],
//     },
//     pdf: String,
//     description: String,
//     time: {
//         type: Date,
//         required: [true, 'The time field is required.'],
//         default: Date.now,
//     },


//     academyID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Account',
//     },

//     rutineID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Routine',
//     },

// });

// const NoticeMoel = mongoose.model('Notice', NoticeSchema);
// module.exports = NoticeMoel;
