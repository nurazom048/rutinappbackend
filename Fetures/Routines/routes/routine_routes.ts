import express from 'express';
import { verifyToken } from "../../../services/Authantication/helper/varifitoken";
const app = express();
// Routine
import {
    createRoutine, deleteRoutine,
    homeFeed, joined_routine, search_routine,
    save_routines, routine_details, save_and_unsave_routine, current_user_status,
} from '../controllers/routine.controllers';
//priode
import { periodModelValidation, } from '../validation/priode.validation';
import { add_priode, edit_priode, delete_priode, all_priode, find_priode_by_id, } from '../controllers/priode_controller';
// Members
import {
    addMember, removeMember, allMembers, notification_Off, notification_On,
    acceptRequest, rejectMember, allRequest, kickOut, leave, sendMemberRequest,
} from '../controllers/members_controller';
import { addCaptain, removeCaptain } from '../controllers/captens.controller';
import { permission_add_Pride, permission_remove_priode, peremption_add_member, permission_edit_priode } from '../middleware/member_mid';
import { Peremption_To_delete_Routine } from '../middleware/routines.middleware';
//
//
//
//
//****************************************************************************/
//
//............................... Routine.....................................//
//
//****************************************************************************/
app.post("/create", verifyToken, createRoutine);// for create routine
app.delete("/:id", verifyToken, Peremption_To_delete_Routine, deleteRoutine); // delete routine

app.post("/home/:userID", verifyToken, homeFeed); /// feed {user can see her uploaded routines}
app.post("/home", verifyToken, homeFeed); /// feed {user can see her uploaded routines and joined routines}

//
app.post('/joined', verifyToken, joined_routine);

//.. search routine ...//
app.get('/search', search_routine);
app.route("/save/routines").post(verifyToken, save_routines); //... Show save routine
app.post('/save_unsave/:routineId', verifyToken, save_and_unsave_routine); // 2

//****************************************************************************/
//
//............................... Priode.....................................//
//
//****************************************************************************/
app.post('/priode/add/:routineID',
    verifyToken,
    periodModelValidation,// check all the required parameters
    permission_add_Pride,
    add_priode,
); // add priode
app.delete('/priode/remove/:priode_id',
    verifyToken,
    permission_remove_priode,
    delete_priode
);// remove period
app.put('/priode/edit/:priodeId',
    verifyToken,
    permission_edit_priode,
    edit_priode,
);

//
app.get('/all_priode/:routineID', all_priode);
app.get('/priode/find/:priode_id', find_priode_by_id);



//****************************************************************************/
//
//............................... Members and captain.........................//
//
//****************************************************************************/

//....... Captain .....//
app.post('/cap10/add/', verifyToken, addCaptain);
app.delete('/cap10/remove', verifyToken, removeCaptain);

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
app.route("/details").post(routine_details);
app.route("/details").post(verifyToken, routine_details);



export default app;
