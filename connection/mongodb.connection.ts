// // imports

import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config

// Connection Paths
const mongodbUri_Production_Maine_DB = process.env.MONGODB_URI_PRODUCTION_PROJECT_MAIN_DB || '';
const mongodbUri_Production_Notice_DB = process.env.MONGODB_URI_PRODUCTION_PROJECT_NOTICES_DB || '';
const mongodbUri_Production_Routine_DB = process.env.MONGODB_URI_PRODUCTION_PROJECT_ROUTINE_DB || '';
const mongodbUri_Production_NotificationDB = process.env.MONGODB_URI_PRODUCTION_PROJECT_NOTIFICATION_DB || '';

// Connect to the test project
export const maineDB = mongoose.createConnection(mongodbUri_Production_Maine_DB)
console.log('db url' + mongodbUri_Production_Maine_DB)
// connect Notice DB
export const NoticeDB = mongoose.createConnection(mongodbUri_Production_Notice_DB);
// connect routineDB
export const RoutineDB = mongoose.createConnection(mongodbUri_Production_Routine_DB);
// connect Notification Db
export const NotificationDB = mongoose.createConnection(mongodbUri_Production_NotificationDB);








