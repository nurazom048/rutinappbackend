import express from 'express';
const app = express();
import verifyToken from "../controllers/Auth/helper/varifitoken";
const classs = require("../controllers/Routines/class_controllers");

// 3
app.post('/:rutin_id/addclass', verifyToken, classs.create_class);
app.post('/eddit/:class_id', verifyToken, classs.edit_class);
app.delete('/delete/:class_id', verifyToken, classs.delete_class);

//
app.get('/:rutin_id/:weekday', classs.show_weekday_classes);
app.get('/:rutin_id/all/class', classs.allclass);
app.post('/:rutin_id/all/class', verifyToken, classs.allclass);
app.get('/find/class/:class_id', classs.findclass);
// notification
app.post('/notification', verifyToken, classs.classNotification);

//
import { validateWeekdayMiddleware } from "../controllers/Routines/middleware/routines.middleware";
// weekday
app.post('/weakday/add/:class_id', validateWeekdayMiddleware, classs.addWeakday);
app.delete('/weakday/delete/:id/:classID', classs.deleteWeekdayById);
// show weekday by class
app.get('/weakday/show/:class_id', classs.allWeekdayInClass);

export default app;
