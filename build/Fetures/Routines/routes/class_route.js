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
const varifitoken_1 = require("../../../services/Authantication/helper/varifitoken");
const weekday_validation_1 = require("../validation/weekday.validation");
const routines_middleware_1 = require("../middleware/routines.middleware");
//
// 3
app.post('/:routineID/addclass', varifitoken_1.verifyToken, class_validation_1.classValidation, class_validation_1.validateClassBookingAndPeremption, class_controllers_1.create_class);
app.post('/eddit/:class_id', varifitoken_1.verifyToken, class_controllers_1.edit_class);
app.delete('/delete/:class_id', varifitoken_1.verifyToken, class_controllers_1.delete_class);
//
app.get('/:routineID/:weekday', class_controllers_1.show_weekday_classes);
app.get('/:routineID/all/class', class_controllers_1.allclass);
app.post('/:routineID/all/class', varifitoken_1.verifyToken, class_controllers_1.allclass);
app.get('/find/class/:class_id', class_controllers_1.findclass);
// notification
app.post('/notification', varifitoken_1.verifyToken, class_controllers_1.classNotification);
//
// weekday
app.post('/weakday/add/:classID', weekday_validation_1.weekdayValidation, routines_middleware_1.validateWeekdayMiddleware, class_controllers_1.addWeekday);
app.delete('/weakday/delete/:id/:classID', class_controllers_1.deleteWeekdayById);
// show weekday by class
app.get('/weakday/show/:class_id', class_controllers_1.allWeekdayInClass);
exports.default = app;
