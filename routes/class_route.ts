import express from 'express';
const app = express();
import { verifyToken } from "../controllers/Auth/helper/varifitoken";
import {
    create_class,
    edit_class,
    deleteWeekdayById,
    delete_class,
    show_weekday_classes,
    allclass,
    findclass,
    classNotification,
    addWeakday,
    allWeekdayInClass,
} from "../controllers/Routines/class_controllers";
import { classValidation } from "../controllers/Routines/validation/class.validation";
//
// Weekday
import { weekdayValidation } from "../controllers/Routines/validation/weekday.validation";
import { validateWeekdayMiddleware } from "../controllers/Routines/middleware/routines.middleware";


//
// 3
app.post('/:rutin_id/addclass', verifyToken, classValidation, create_class);
app.post('/eddit/:class_id', verifyToken, edit_class);
app.delete('/delete/:class_id', verifyToken, delete_class);

//
app.get('/:rutin_id/:weekday', show_weekday_classes);
app.get('/:rutin_id/all/class', allclass);
app.post('/:rutin_id/all/class', verifyToken, allclass);
app.get('/find/class/:class_id', findclass);
// notification
app.post('/notification', verifyToken, classNotification);

//
// weekday
app.post('/weakday/add/:class_id', weekdayValidation, validateWeekdayMiddleware, addWeakday);
app.delete('/weakday/delete/:id/:classID', deleteWeekdayById);
// show weekday by class
app.get('/weakday/show/:class_id', allWeekdayInClass);

export default app;
