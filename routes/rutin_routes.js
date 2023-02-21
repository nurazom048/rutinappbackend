const express = require('express')
const app = express()
const rutin = require('../controllers/rutin_controllers');
const priode = require('../controllers/priode_controller');
const verifyToken = require("../varifitoken")


// 2 
app.post("/create", verifyToken,rutin.createRutin);
app.delete("/delete/:id", verifyToken,rutin.delete);

//
app.post("/allrutins", verifyToken,rutin.allRutin);


//.. save and unsave rutin ..//
app.get('/save/:rutin_id',verifyToken, rutin.save_routine);
app.get('/unsave/:rutin_id',verifyToken, rutin.unsave_routine);
app.get('/save/:rutin_id/chack',verifyToken, rutin.save_checkout);


//... priode add...//
app.post('/add_priode/:rutin_id',verifyToken,priode.add_priode );

//
app.post('/all_priode/:rutin_id',priode.all_priode );


module.exports = app;