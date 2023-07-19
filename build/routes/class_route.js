"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const varifitoken_1 = __importDefault(require("../controllers/Auth/helper/varifitoken"));
const classs = require("../controllers/Routines/class_controllers");
// 3
app.post('/:rutin_id/addclass', varifitoken_1.default, classs.create_class);
app.post('/eddit/:class_id', varifitoken_1.default, classs.edit_class);
app.delete('/delete/:class_id', varifitoken_1.default, classs.delete_class);
//
app.get('/:rutin_id/:weekday', classs.show_weekday_classes);
app.get('/:rutin_id/all/class', classs.allclass);
app.post('/:rutin_id/all/class', varifitoken_1.default, classs.allclass);
app.get('/find/class/:class_id', classs.findclass);
// notification
app.post('/notification', varifitoken_1.default, classs.classNotification);
//
const routines_middleware_1 = require("../controllers/Routines/middleware/routines.middleware");
// weekday
app.post('/weakday/add/:class_id', routines_middleware_1.validateWeekdayMiddleware, classs.addWeakday);
app.delete('/weakday/delete/:id/:classID', classs.deleteWeekdayById);
// show weekday by class
app.get('/weakday/show/:class_id', classs.allWeekdayInClass);
exports.default = app;
