"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const varifitoken_1 = __importDefault(require("../controllers/Auth/helper/varifitoken"));
const app = (0, express_1.default)();
// controller
const routine = require('../controllers/Routines/routine.controllers');
const priode = require('../controllers/Routines/priode_controller');
const member = require('../controllers/Routines/members_controller');
const captens_controller_1 = require("../controllers/Routines/captens.controller");
const member_mid_1 = require("../controllers/Routines/middleware/member_mid");
//
//
// 1
app.post("/create", varifitoken_1.default, routine.createRutin);
app.route("/:id")
    .delete(varifitoken_1.default, routine.deleteRoutine); // delete rutin
//... get full routine
app.post("/allrutins", varifitoken_1.default, routine.allRutin);
app.post("/home/:userID", varifitoken_1.default, routine.homeFeed); /// feed
app.post("/home", varifitoken_1.default, routine.homeFeed); /// feed
//
app.post('/joined', varifitoken_1.default, routine.joined_rutins);
//.. search routine ...//
app.get('/search', routine.search_rutins);
//... priode add remove priode ...//
app.post('/priode/add/:rutin_id', varifitoken_1.default, member_mid_1.permission_add_Pride, priode.add_priode); // add priode
app.delete('/priode/remove/:priode_id', priode.delete_priode);
app.put('/priode/eddit/:priode_id', priode.edit_priode);
//
app.get('/all_priode/:rutin_id', priode.all_priode);
app.get('/priode/find/:priode_id', priode.find_priode_by_id);
//....... Captain .....//
app.post('/cap10/add/', varifitoken_1.default, captens_controller_1.addCaptain);
app.delete('/cap10/remove', varifitoken_1.default, captens_controller_1.removeCaptain);
//........... Add member .....//
app.post('/member/add/:rutin_id/:username', varifitoken_1.default, member_mid_1.peremption_add_member, member.addMebers);
app.post('/member/remove/:rutin_id/:username', varifitoken_1.default, member_mid_1.peremption_add_member, member.removeMember);
app.post('/member/:rutin_id/', member.allMembers);
app.post('/member/leave/:rutin_id', varifitoken_1.default, member.leave);
app.delete('/member/kickout/:rutin_id/:memberid', varifitoken_1.default, member.kickOut);
//
app.post('/member/send_request/:rutin_id', varifitoken_1.default, member.sendMemberRequest);
app.post('/member/see_all_request/:rutin_id', varifitoken_1.default, member.allRequest);
app.post('/member/acsept_request/:rutin_id', varifitoken_1.default, member.acceptRequest);
app.post('/member/reject_request/:rutin_id', varifitoken_1.default, member.rejectMember);
//notification on off
app.post('/notification/off/:rutin_id', varifitoken_1.default, member.notification_Off);
app.post('/notification/on/:rutin_id', varifitoken_1.default, member.notification_On);
//... Show uploaded save rutin
app.route("/uploded_rutins").post(varifitoken_1.default, routine.uploaded_rutins);
app.route("/uploded_rutins/:username").post(routine.uploaded_rutins);
//.. check current stuts ...//
app.post('/status/:routineId/', varifitoken_1.default, routine.current_user_status);
app.route("/details").post(routine.rutinDetails);
app.route("/details").post(varifitoken_1.default, routine.rutinDetails);
app.route("/save/routines").post(varifitoken_1.default, routine.save_routines); //... Show save rutin
app.post('/save_unsave/:routineId', varifitoken_1.default, routine.save_and_unsave_routine); // 2
exports.default = app;
