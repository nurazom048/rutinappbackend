import express from 'express';
import { verifyToken } from "../../../services/Authentication/helper/Authentication";
const app = express();
import { createRoutine, homeFeed, searchRoutine, save_routines, save_and_unsave_routine, current_user_status, deleteRoutineById } from '../controllers/routine.controllers';
import { addMember, removeMember, allMembers, notification_Off, acceptRequest, rejectMember, allRequest, kickOut, leaveMember, sendMemberRequest, notification_On } from '../controllers/members_controller';
import { addCaptain, removeCaptain } from '../controllers/captans.controller';
import { createRoutineValidation } from '../middleware/routines.middleware';
import { routineModificationPermission } from '../middleware/permission.routine.mid';
//
//
//
//
//****************************************************************************/
//............................... Routine...................................../
//****************************************************************************/

app.post("/create", verifyToken, createRoutineValidation, createRoutine);// for create routine
app.delete("/:routineID",
    verifyToken,
    routineModificationPermission,
    deleteRoutineById,); // delete routine

app.post("/home/:userID", verifyToken, homeFeed); /// feed {user can see her uploaded routines}
app.post("/home", verifyToken, homeFeed); /// feed {user can see her uploaded routines and joined routines}



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
app.post('/member/add/:routineID/:username', verifyToken, routineModificationPermission, addMember);
app.post('/member/remove/:routineID/:username', verifyToken, routineModificationPermission, removeMember);
app.post('/member/:routineID/', allMembers);
app.post('/member/leave/:routineID', verifyToken, leaveMember);
app.delete('/member/kickout/:routineID/:memberID', verifyToken, routineModificationPermission, kickOut);

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
