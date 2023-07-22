import express from 'express';
import { verifyToken } from "../controllers/Auth/helper/varifitoken";
const app = express();
// controller
import {
    createRoutine, deleteRoutine, all_Routine,
    homeFeed, joined_routine, search_routine, uploaded_routine,
    save_routines, routine_details, save_and_unsave_routine, current_user_status,
} from '../controllers/Routines/routine.controllers';
//priode
import { periodModelValidation } from '../controllers/Routines/validation/priode.validation';

import { add_priode, edit_priode, delete_priode, all_priode, find_priode_by_id } from '../controllers/Routines/priode_controller';
import {
    addMember, removeMember, allMembers,
    notification_Off, notification_On,
    acceptRequest, rejectMember, allRequest, kickOut, leave, sendMemberRequest,
} from '../controllers/Routines/members_controller';
import { addCaptain, removeCaptain } from '../controllers/Routines/captens.controller';
import { permission_add_Pride, permission_remove_priode, peremption_add_member } from '../controllers/Routines/middleware/member_mid';








//
//
// 1
app.post("/create", verifyToken, createRoutine);
app.route("/:id")
    .delete(verifyToken, deleteRoutine); // delete routine

//... get full routine
app.post("/allrutins", verifyToken, all_Routine);
app.post("/home/:userID", verifyToken, homeFeed); /// feed
app.post("/home", verifyToken, homeFeed); /// feed

//
app.post('/joined', verifyToken, joined_routine);

//.. search routine ...//
app.get('/search', search_routine);

//... priode add remove priode ...//
app.post('/priode/add/:rutin_id', verifyToken, periodModelValidation, permission_add_Pride, add_priode); // add priode
app.delete('/priode/remove/:priode_id', delete_priode);
app.put('/priode/eddit/:priode_id', edit_priode);

//
app.get('/all_priode/:rutin_id', all_priode);
app.get('/priode/find/:priode_id', find_priode_by_id);

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
app.post('/member/send_request/:rutin_id', verifyToken, sendMemberRequest);
app.post('/member/see_all_request/:rutin_id', verifyToken, allRequest);
app.post('/member/acsept_request/:rutin_id', verifyToken, acceptRequest);
app.post('/member/reject_request/:rutin_id', verifyToken, rejectMember);

//notification on off
app.post('/notification/off/:rutin_id', verifyToken, notification_Off);
app.post('/notification/on/:rutin_id', verifyToken, notification_On);

//... Show uploaded save rutin
app.route("/uploded_rutins").post(verifyToken, uploaded_routine);
app.route("/uploded_rutins/:username").post(uploaded_routine);

//.. check current stuts ...//
app.post('/status/:routineId/', verifyToken, current_user_status);
app.route("/details").post(routine_details);
app.route("/details").post(verifyToken, routine_details);

app.route("/save/routines").post(verifyToken, save_routines); //... Show save rutin
app.post('/save_unsave/:routineId', verifyToken, save_and_unsave_routine); // 2

export default app;
