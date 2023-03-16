
const express = require('express')
const app = express()
const rutin = require('../controllers/rutin_controllers');
const priode = require('../controllers/priode_controller');
const cp10 = require('../controllers/cp10');
const verifyToken = require("../varifitoken")
const Middleware = require('../midlewere/rutinMidewere');
const member = require('../controllers/members_controller');

const member_mid = require('../midlewere/member_mid');




// 1 
app.post("/create", verifyToken, rutin.createRutin);
app.route("/:id")
    .delete(verifyToken, Middleware.Routine_Owner, rutin.delete);// delete rutin

//... grt full rutine
app.post("/allrutins", verifyToken, rutin.allRutin);


// 2 
//.. save and unsave rutin ..//
app.get('/save/:rutin_id', verifyToken, rutin.add_to_save_routine);
app.get('/unsave/:rutin_id', verifyToken, rutin.unsave_routine);
app.get('/save/:rutin_id/chack', verifyToken, rutin.save_checkout);

//.. search rutin ...//
app.get('/search/:src', rutin.search_rutins);



const { permition_add_priode, vadlidator_add_priode, permition_remove_priode } = require('../midlewere/priode_mid');

//... priode add  remove priode ...//

app.post('/priode/add/:rutin_id', verifyToken, permition_add_priode, vadlidator_add_priode, priode.add_priode);// add priode
app.delete('/priode/remove/:priodeId', verifyToken, permition_remove_priode, priode.delete_priode);
app.post('/all_priode/:rutin_id', priode.all_priode);


//....... cap 10 .....//
app.post('/cap10/add/', verifyToken, cp10.addCap10);
app.post('/cap10/remove', verifyToken, cp10.removeCap10);


//........... Add member .....//
app.post('/member/add/:rutin_id/:username', verifyToken, member_mid.permition_add_member, member.addMebers);
app.post('/member/remove/:rutin_id/:username', verifyToken, member_mid.permition_add_member, member.removeMember);
app.post('/member/:rutin_id/', member.allMembers);

//
app.post('/member/send_request/:rutin_id', verifyToken, member.sendMemberRequest);
app.post('/member/see_all_request/:rutin_id', verifyToken, member.allRequest);
app.post('/member/acsept_request/:rutin_id', verifyToken, member.acceptRequest);
app.post('/member/reject_request/:rutin_id', verifyToken, member.rejectMember);





//......... for vieew ritins.........//

//... Show save rutin

app.route("/save_rutins").post(verifyToken, rutin.save_rutins);
app.route("/save_rutins/:username").post(rutin.save_rutins);

//... Show uploaded save rutin
app.route("/uploded_rutins").post(verifyToken, rutin.uploaded_rutins);
app.route("/uploded_rutins/:username").post(rutin.uploaded_rutins);

//.. chack current stuts ...//

app.post('/status/:rutin_id/', verifyToken, rutin.current_user_status);




module.exports = app;
