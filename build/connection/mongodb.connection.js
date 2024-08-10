"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDB = exports.RoutineDB = exports.NoticeDB = exports.maineDB = void 0;
// imports
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Connection Paths
const mongodbUri_Production_Maine_DB = process.env.MONGODB_URI_PRODUCTION_PROJECT_MAIN_DB || '';
const mongodbUri_Production_Notice_DB = process.env.MONGODB_URI_PRODUCTION_PROJECT_NOTICES_DB || '';
const mongodbUri_Production_Routine_DB = process.env.MONGODB_URI_PRODUCTION_PROJECT_ROUTINE_DB || '';
const mongodbUri_Production_NotificationDB = process.env.MONGODB_URI_PRODUCTION_PROJECT_NOTIFICATION_DB || '';
// Connect to the test project
exports.maineDB = mongoose_1.default.createConnection(mongodbUri_Production_Maine_DB);
console.log('db url' + mongodbUri_Production_Maine_DB);
// connect Notice DB
exports.NoticeDB = mongoose_1.default.createConnection(mongodbUri_Production_Notice_DB);
// connect routineDB
exports.RoutineDB = mongoose_1.default.createConnection(mongodbUri_Production_Routine_DB);
// connect Notification Db
exports.NotificationDB = mongoose_1.default.createConnection(mongodbUri_Production_NotificationDB);
//
// const mongodbUri_Test = process.env.MONGODB_URI_TEST_PROJECT || '';
// const mongodbUri_Beta = process.env.MONGODB_URI_BETA_PROJECT || '';
