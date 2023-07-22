"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const varifitoken_1 = require("../controllers/Auth/helper/varifitoken");
const app = (0, express_1.default)();
// controller
const routine_controllers_1 = require("../controllers/Routines/routine.controllers");
//priode
const priode_validation_1 = require("../controllers/Routines/validation/priode.validation");
const priode_controller_1 = require("../controllers/Routines/priode_controller");
const members_controller_1 = require("../controllers/Routines/members_controller");
const captens_controller_1 = require("../controllers/Routines/captens.controller");
const member_mid_1 = require("../controllers/Routines/middleware/member_mid");
//
//
// 1
app.post("/create", varifitoken_1.verifyToken, routine_controllers_1.createRoutine);
app.route("/:id")
    .delete(varifitoken_1.verifyToken, routine_controllers_1.deleteRoutine); // delete routine
//... get full routine
app.post("/allrutins", varifitoken_1.verifyToken, routine_controllers_1.all_Routine);
app.post("/home/:userID", varifitoken_1.verifyToken, routine_controllers_1.homeFeed); /// feed
app.post("/home", varifitoken_1.verifyToken, routine_controllers_1.homeFeed); /// feed
//
app.post('/joined', varifitoken_1.verifyToken, routine_controllers_1.joined_routine);
//.. search routine ...//
app.get('/search', routine_controllers_1.search_routine);
//... priode add remove priode ...//
app.post('/priode/add/:rutin_id', varifitoken_1.verifyToken, priode_validation_1.periodModelValidation, member_mid_1.permission_add_Pride, priode_controller_1.add_priode); // add priode
app.delete('/priode/remove/:priode_id', priode_controller_1.delete_priode);
app.put('/priode/eddit/:priode_id', priode_controller_1.edit_priode);
//
app.get('/all_priode/:rutin_id', priode_controller_1.all_priode);
app.get('/priode/find/:priode_id', priode_controller_1.find_priode_by_id);
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
app.post('/member/send_request/:rutin_id', varifitoken_1.verifyToken, members_controller_1.sendMemberRequest);
app.post('/member/see_all_request/:rutin_id', varifitoken_1.verifyToken, members_controller_1.allRequest);
app.post('/member/acsept_request/:rutin_id', varifitoken_1.verifyToken, members_controller_1.acceptRequest);
app.post('/member/reject_request/:rutin_id', varifitoken_1.verifyToken, members_controller_1.rejectMember);
//notification on off
app.post('/notification/off/:rutin_id', varifitoken_1.verifyToken, members_controller_1.notification_Off);
app.post('/notification/on/:rutin_id', varifitoken_1.verifyToken, members_controller_1.notification_On);
//... Show uploaded save rutin
app.route("/uploded_rutins").post(varifitoken_1.verifyToken, routine_controllers_1.uploaded_routine);
app.route("/uploded_rutins/:username").post(routine_controllers_1.uploaded_routine);
//.. check current stuts ...//
app.post('/status/:routineId/', varifitoken_1.verifyToken, routine_controllers_1.current_user_status);
app.route("/details").post(routine_controllers_1.routine_details);
app.route("/details").post(varifitoken_1.verifyToken, routine_controllers_1.routine_details);
app.route("/save/routines").post(varifitoken_1.verifyToken, routine_controllers_1.save_routines); //... Show save rutin
app.post('/save_unsave/:routineId', varifitoken_1.verifyToken, routine_controllers_1.save_and_unsave_routine); // 2
exports.default = app;
