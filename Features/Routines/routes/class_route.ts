import express from 'express';
const app = express();
import {
    create_class,
    edit_class,
    deleteWeekdayById,
    delete_class,
    show_weekday_classes,
    allclass,
    findclass,
    classNotification,
    addWeekday,
    allWeekdayInClass,
} from "../controllers/class_controllers";
import { classEditValidation, classValidation, validateClassBookingAndPeremption } from "../validation/class.validation";
//
// Weekday
import { verifyToken } from '../../../services/Authentication/helper/Authentication';
import { weekdayValidation } from '../validation/weekday.validation';


//
// 3
app.post('/:routineID/addclass',
    verifyToken,
    classValidation,
    validateClassBookingAndPeremption,
    create_class,
);
app.post('/edit/:class_id', verifyToken, classEditValidation, edit_class);
app.delete('/delete/:class_id', verifyToken, delete_class);

//
app.get('/:routineID/:weekday', show_weekday_classes);
app.get('/:routineID/all/class', allclass);
app.post('/:routineID/all/class', verifyToken, allclass);
app.get('/find/class/:class_id', findclass);
// notification
app.post('/notification', verifyToken, classNotification);

//
// weekday
app.post('/weekday/add/:classID',
    weekdayValidation,
    addWeekday,
);
app.delete('/weakday/delete/:id/:classID', deleteWeekdayById);
// show weekday by class
app.get('/weekday/show/:class_id', allWeekdayInClass);

export default app;
