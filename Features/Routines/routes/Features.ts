import express from 'express';
import { verifyToken } from "../../../services/Authentication/helper/Authentication";
const app = express();
// Routine
import {
    createRoutine, deleteRoutine,
    homeFeed, joined_routine, searchRoutine,
    save_routines, save_and_unsave_routine, current_user_status,
} from '../controllers/routine.controllers';
//priode
import { periodModelValidation, } from '../validation/priode.validation';
// Members
import {
    addMember, removeMember, allMembers, notification_Off, notification_On,
    acceptRequest, rejectMember, allRequest, kickOut, leave, sendMemberRequest,
} from '../controllers/members_controller';
import { addCaptain, removeCaptain } from '../controllers/captens.controller';
import { permission_add_Pride, peremption_add_member } from '../middleware/member_mid';
import { createRoutineValidation, Peremption_To_delete_Routine } from '../middleware/routines.middleware';
//
//
//
//
//****************************************************************************/
//............................... Routine...................................../
//****************************************************************************/

app.post("/create", verifyToken, createRoutineValidation, createRoutine);// for create routine
app.delete("/:id",
    verifyToken,
    Peremption_To_delete_Routine,
    deleteRoutine,); // delete routine

app.post("/home/:userID", verifyToken, homeFeed); /// feed {user can see her uploaded routines}
app.post("/home", verifyToken, homeFeed); /// feed {user can see her uploaded routines and joined routines}

//
app.post('/joined', verifyToken, joined_routine);

//.. search routine ...//
app.get('/search', searchRoutine);
app.route("/save/routines").post(verifyToken, save_routines); //... Show save routine
app.post('/save_unsave/:routineId', verifyToken, save_and_unsave_routine); // 2

//****************************************************************************/
//............................... Members and captain.........................//
//****************************************************************************/

//....... Captain .....//
app.post('/captain/add', verifyToken, addCaptain);
app.delete('/captain/remove', verifyToken, removeCaptain);

//........... Add member .....//
app.post('/member/add/:routineID/:username', verifyToken, peremption_add_member, addMember);
app.post('/member/remove/:routineID/:username', verifyToken, peremption_add_member, removeMember);
app.post('/member/:routineID/', allMembers);
app.post('/member/leave/:routineID', verifyToken, leave);
app.delete('/member/kickout/:routineID/:memberID', verifyToken, kickOut);

//
app.post('/member/send_request/:routineID', verifyToken, sendMemberRequest);
app.post('/member/see_all_request/:routineID', verifyToken, allRequest);
app.post('/member/acsept_request/:routineID', verifyToken, acceptRequest);
app.post('/member/reject_request/:routineID', verifyToken, rejectMember);

//notification on off
app.post('/notification/off/:routineID', verifyToken, notification_Off);
app.post('/notification/on/:routineID', verifyToken, notification_On);



//.. check current status ...//
app.post('/status/:routineId/', verifyToken, current_user_status);




export default app;
