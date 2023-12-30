"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const varifitoken_1 = require("../../../services/Authantication/helper/varifitoken");
const app = (0, express_1.default)();
// Routine
const routine_controllers_1 = require("../controllers/routine.controllers");
//priode
const priode_validation_1 = require("../validation/priode.validation");
const priode_controller_1 = require("../controllers/priode_controller");
// Members
const members_controller_1 = require("../controllers/members_controller");
const captens_controller_1 = require("../controllers/captens.controller");
const member_mid_1 = require("../middleware/member_mid");
const routines_middleware_1 = require("../middleware/routines.middleware");
//
//
//
//
//****************************************************************************/
//............................... Routine...................................../
//****************************************************************************/
app.post("/create", varifitoken_1.verifyToken, routine_controllers_1.createRoutine); // for create routine
app.delete("/:id", varifitoken_1.verifyToken, routines_middleware_1.Peremption_To_delete_Routine, routine_controllers_1.deleteRoutine); // delete routine
app.post("/home/:userID", varifitoken_1.verifyToken, routine_controllers_1.homeFeed); /// feed {user can see her uploaded routines}
app.post("/home", varifitoken_1.verifyToken, routine_controllers_1.homeFeed); /// feed {user can see her uploaded routines and joined routines}
//
app.post('/joined', varifitoken_1.verifyToken, routine_controllers_1.joined_routine);
//.. search routine ...//
app.get('/search', routine_controllers_1.search_routine);
app.route("/save/routines").post(varifitoken_1.verifyToken, routine_controllers_1.save_routines); //... Show save routine
app.post('/save_unsave/:routineId', varifitoken_1.verifyToken, routine_controllers_1.save_and_unsave_routine); // 2
//****************************************************************************/
//............................... Priode.....................................//
//****************************************************************************/
app.post('/priode/add/:routineID', varifitoken_1.verifyToken, priode_validation_1.periodModelValidation, // check all the required parameters
member_mid_1.permission_add_Pride, priode_controller_1.add_priode); // add priode
app.delete('/priode/remove/:priodeId', varifitoken_1.verifyToken, member_mid_1.permission_remove_priode, priode_controller_1.delete_priode); // remove period
app.put('/priode/edit/:priodeId', varifitoken_1.verifyToken, member_mid_1.permission_edit_priode, priode_controller_1.edit_priode);
//
app.get('/all_priode/:routineID', priode_controller_1.all_priode);
app.get('/priode/find/:priode_id', priode_controller_1.find_priode_by_id);
//****************************************************************************/
//............................... Members and captain.........................//
//****************************************************************************/
//....... Captain .....//
app.post('/cap10/add/', varifitoken_1.verifyToken, captens_controller_1.addCaptain);
app.delete('/cap10/remove', varifitoken_1.verifyToken, captens_controller_1.removeCaptain);
//........... Add member .....//
app.post('/member/add/:routineID/:username', varifitoken_1.verifyToken, member_mid_1.peremption_add_member, members_controller_1.addMember);
app.post('/member/remove/:routineID/:username', varifitoken_1.verifyToken, member_mid_1.peremption_add_member, members_controller_1.removeMember);
app.post('/member/:routineID/', members_controller_1.allMembers);
app.post('/member/leave/:routineID', varifitoken_1.verifyToken, members_controller_1.leave);
app.delete('/member/kickout/:routineID/:memberID', varifitoken_1.verifyToken, members_controller_1.kickOut);
//
app.post('/member/send_request/:routineID', varifitoken_1.verifyToken, members_controller_1.sendMemberRequest);
app.post('/member/see_all_request/:routineID', varifitoken_1.verifyToken, members_controller_1.allRequest);
app.post('/member/acsept_request/:routineID', varifitoken_1.verifyToken, members_controller_1.acceptRequest);
app.post('/member/reject_request/:routineID', varifitoken_1.verifyToken, members_controller_1.rejectMember);
//notification on off
app.post('/notification/off/:routineID', varifitoken_1.verifyToken, members_controller_1.notification_Off);
app.post('/notification/on/:routineID', varifitoken_1.verifyToken, members_controller_1.notification_On);
//.. check current status ...//
app.post('/status/:routineId/', varifitoken_1.verifyToken, routine_controllers_1.current_user_status);
app.route("/details").post(routine_controllers_1.routine_details);
app.route("/details").post(varifitoken_1.verifyToken, routine_controllers_1.routine_details);
exports.default = app;
