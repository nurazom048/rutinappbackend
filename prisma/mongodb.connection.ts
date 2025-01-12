import mongoose from 'mongoose';

// Direct Database Connection Strings
const mongodbUri_Production_Maine_DB = 'mongodb+srv://eduClassmateMongodb:rahalaNur123@clusteeduclassmate.4ccnh3n.mongodb.net/MainBD?retryWrites=true&w=majority';
const mongodbUri_Production_Notice_DB = 'mongodb+srv://eduClassmateMongodb:rahalaNur123@clusteeduclassmate.4ccnh3n.mongodb.net/NoticeDB?retryWrites=true&w=majority';
const mongodbUri_Production_Routine_DB = 'mongodb+srv://eduClassmateMongodb:rahalaNur123@clusteeduclassmate.4ccnh3n.mongodb.net/RoutineDB?retryWrites=true&w=majority';
const mongodbUri_Production_NotificationDB = 'mongodb+srv://eduClassmateMongodb:rahalaNur123@clusteeduclassmate.4ccnh3n.mongodb.net/NotificationDB?retryWrites=true&w=majority';

// Connect to the Main Database
export const maineDB = mongoose.createConnection(mongodbUri_Production_Maine_DB);
maineDB.once('open', () => console.log('Connected to Main Database'));

// Connect to the Notice Database
export const NoticeDB = mongoose.createConnection(mongodbUri_Production_Notice_DB);
NoticeDB.once('open', () => console.log('Connected to Notice Database'));

// Connect to the Routine Database
export const RoutineDB = mongoose.createConnection(mongodbUri_Production_Routine_DB);
RoutineDB.once('open', () => console.log('Connected to Routine Database'));

// Connect to the Notification Database
export const NotificationDB = mongoose.createConnection(mongodbUri_Production_NotificationDB);
NotificationDB.once('open', () => console.log('Connected to Notification Database'));
