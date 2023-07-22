

import mongoose, { Document, Schema, Model } from 'mongoose';

enum NotificationType {
  Public = 'public',
  Private = 'private',
}

interface INotification extends Document {
  accountID: string;
  title: string;
  body?: string;
  imageUrl?: string;
  routineID?: mongoose.Types.ObjectId;
  NoticeID?: mongoose.Types.ObjectId;
  type: NotificationType;
  createdAt: Date;
}

const notificationSchema: Schema<INotification> = new Schema<INotification>({
  accountID: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  body: String,
  imageUrl: String,
  routineID: {
    type: Schema.Types.ObjectId,
    ref: 'Routine',
  },
  NoticeID: {
    type: Schema.Types.ObjectId,
    ref: 'Notice',
  },
  type: {
    type: String,
    enum: [NotificationType.Public, NotificationType.Private],
    required: true,
    default: NotificationType.Public,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;

















// const mongoose = require('mongoose');

// const notificationSchema = new mongoose.Schema({
//     accountID: {
//         type: String,
//     },
//     title: {
//         type: String,
//         required: true,
//     },
//     body: {
//         type: String,
//     },
//     imageUrl: {
//         type: String,
//     },
//     rutineID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Routine',
//     },
//     NoticeID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Notice',
//     },
//     type: {
//         type: String,
//         enum: ['public', 'private'],
//         required: true,
//         default: 'public',
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     },
// });

// const Notification = mongoose.model('Notification', notificationSchema);

// module.exports = Notification;