import express from 'express';
import verifyToken from "../controllers/Auth/helper/varifitoken";
const app = express();
// controller
const routine = require('../controllers/Routines/routine.controllers');
const priode = require('../controllers/Routines/priode_controller');
const member = require('../controllers/Routines/members_controller');
import { addCaptain, removeCaptain } from '../controllers/Routines/captens.controller';
import { permission_add_Pride, permission_remove_priode, peremption_add_member } from '../controllers/Routines/middleware/member_mid';








//
//
// 1
app.post("/create", verifyToken, routine.createRutin);
app.route("/:id")
    .delete(verifyToken, routine.deleteRoutine); // delete rutin

//... get full routine
app.post("/allrutins", verifyToken, routine.allRutin);
app.post("/home/:userID", verifyToken, routine.homeFeed); /// feed
app.post("/home", verifyToken, routine.homeFeed); /// feed

//
app.post('/joined', verifyToken, routine.joined_rutins);

//.. search routine ...//
app.get('/search', routine.search_rutins);

//... priode add remove priode ...//
app.post('/priode/add/:rutin_id', verifyToken, permission_add_Pride, priode.add_priode); // add priode
app.delete('/priode/remove/:priode_id', priode.delete_priode);
app.put('/priode/eddit/:priode_id', priode.edit_priode);

//
app.get('/all_priode/:rutin_id', priode.all_priode);
app.get('/priode/find/:priode_id', priode.find_priode_by_id);

//....... Captain .....//
app.post('/cap10/add/', verifyToken, addCaptain);
app.delete('/cap10/remove', verifyToken, removeCaptain);

//........... Add member .....//
app.post('/member/add/:rutin_id/:username', verifyToken, peremption_add_member, member.addMebers);
app.post('/member/remove/:rutin_id/:username', verifyToken, peremption_add_member, member.removeMember);
app.post('/member/:rutin_id/', member.allMembers);
app.post('/member/leave/:rutin_id', verifyToken, member.leave);
app.delete('/member/kickout/:rutin_id/:memberid', verifyToken, member.kickOut);

//
app.post('/member/send_request/:rutin_id', verifyToken, member.sendMemberRequest);
app.post('/member/see_all_request/:rutin_id', verifyToken, member.allRequest);
app.post('/member/acsept_request/:rutin_id', verifyToken, member.acceptRequest);
app.post('/member/reject_request/:rutin_id', verifyToken, member.rejectMember);

//notification on off
app.post('/notification/off/:rutin_id', verifyToken, member.notification_Off);
app.post('/notification/on/:rutin_id', verifyToken, member.notification_On);

//... Show uploaded save rutin
app.route("/uploded_rutins").post(verifyToken, routine.uploaded_rutins);
app.route("/uploded_rutins/:username").post(routine.uploaded_rutins);

//.. check current stuts ...//
app.post('/status/:routineId/', verifyToken, routine.current_user_status);
app.route("/details").post(routine.rutinDetails);
app.route("/details").post(verifyToken, routine.rutinDetails);

app.route("/save/routines").post(verifyToken, routine.save_routines); //... Show save rutin
app.post('/save_unsave/:routineId', verifyToken, routine.save_and_unsave_routine); // 2

export default app;
