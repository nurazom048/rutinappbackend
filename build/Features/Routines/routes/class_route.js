"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const class_controllers_1 = require("../controllers/class_controllers");
const class_validation_1 = require("../validation/class.validation");
//
// Weekday
const Authentication_1 = require("../../../services/Authentication/helper/Authentication");
const weekday_validation_1 = require("../validation/weekday.validation");
//
// 3
app.post('/:routineID/addclass', Authentication_1.verifyToken, class_validation_1.classValidation, class_validation_1.validateClassBookingAndPeremption, class_controllers_1.create_class);
app.post('/edit/:class_id', Authentication_1.verifyToken, class_validation_1.classEditValidation, class_controllers_1.edit_class);
app.delete('/delete/:class_id', Authentication_1.verifyToken, class_controllers_1.delete_class);
//
app.get('/:routineID/:weekday', class_controllers_1.show_weekday_classes);
app.get('/:routineID/all/class', class_controllers_1.allclass);
app.post('/:routineID/all/class', Authentication_1.verifyToken, class_controllers_1.allclass);
app.get('/find/class/:class_id', class_controllers_1.findclass);
// notification
app.post('/notification', Authentication_1.verifyToken, class_controllers_1.classNotification);
//
// weekday
app.post('/weekday/add/:classID', weekday_validation_1.weekdayValidation, class_controllers_1.addWeekday);
app.delete('/weakday/delete/:id/:classID', class_controllers_1.deleteWeekdayById);
// show weekday by class
app.get('/weekday/show/:class_id', class_controllers_1.allWeekdayInClass);
exports.default = app;
