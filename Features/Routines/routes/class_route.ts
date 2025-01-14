import express from 'express';
const app = express();
import {
    create_class,
    edit_class,
    deleteWeekdayById,
    remove_class,
    show_weekday_classes,
    allClass,
    findClass,
    classNotification,
    addWeekday,
    allWeekdayInClass,
} from "../controllers/class_controllers";
import { cakedPermission, classEditValidation, classValidation, weekdayValidation } from "../validation/routine.validation";
//
// Weekday
import { verifyToken } from '../../../services/Authentication/helper/Authentication';
import { checkClassAndPermission } from '../middleware/class.middleware';


//
// 3
app.post('/:routineId/addclass', verifyToken, classValidation, cakedPermission, create_class);
app.post('/edit/:classID', verifyToken, classEditValidation, checkClassAndPermission, edit_class);
app.delete('/remove/:classID', verifyToken, checkClassAndPermission, remove_class);

//
app.get('/:routineID/:weekday', show_weekday_classes);
app.get('/:routineID/all/class', allClass);
// app.post('/:routineID/all/class', verifyToken, allclass);
app.get('/find/class/:classID', findClass);
// notification
app.post('/notification', verifyToken, classNotification);
// weekday
app.put('/weekday/:classID', weekdayValidation, addWeekday);
app.delete('/weekday/:weekdayID', deleteWeekdayById);
// show weekday by class
app.get('/weekday/show/:ClassID', allWeekdayInClass);

export default app;
