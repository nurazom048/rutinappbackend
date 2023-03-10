const express = require('express')
const app = express()
const rutin = require('../controllers/rutin_controllers');
const priode = require('../controllers/priode_controller');
const cp10 = require('../controllers/cp10');
const verifyToken = require("../varifitoken")



const router = express.Router();
///
const Middleware = require('../midlewere/rutinMidewere');
const priode_mid = require('../midlewere/priode_mid');




// 2 
app.post("/create", verifyToken, rutin.createRutin);

router.route("/:id")
    .delete(verifyToken, Middleware.Routine_Owner, rutin.delete);

//... grt full rutine
app.post("/allrutins", verifyToken, rutin.allRutin);


//.. save and unsave rutin ..//
app.get('/save/:rutin_id', verifyToken, rutin.save_routine);
app.get('/unsave/:rutin_id', verifyToken, rutin.unsave_routine);
app.get('/save/:rutin_id/chack', verifyToken, rutin.save_checkout);


//.. search rutin ...//
app.post('/search/:src', rutin.search_rutins);

//... priode add  remove priode ...//
router.route('/priode/add/:id')
    .post(verifyToken, priode_mid.permition_add_priode, priode_mid.vadlidator_add_priode, priode.add_priode);
router.route('/priode/remove/:priodeId')
    .delete(verifyToken, priode_mid.permition_remove_priode, priode.delete_priode);


app.post('/all_priode/:rutin_id', priode.all_priode);




//....... cap 10 .....//
app.post('/cap10/add/', verifyToken, cp10.addCap10);
app.post('/cap10/remove', verifyToken, cp10.removeCap10);

module.exports = app;
module.exports = router;