const express = require('express')
const app = express()
const rutin = require('../controllers/rutin_controllers');
const priode = require('../controllers/priode_controller');
const cp10 = require('../controllers/cp10');
const verifyToken = require("../varifitoken")


// 2 
app.post("/create", verifyToken, rutin.createRutin);
app.delete("/delete/:id", verifyToken, rutin.delete);

//
app.post("/allrutins", verifyToken, rutin.allRutin);


//.. save and unsave rutin ..//
app.get('/save/:rutin_id', verifyToken, rutin.save_routine);
app.get('/unsave/:rutin_id', verifyToken, rutin.unsave_routine);
app.get('/save/:rutin_id/chack', verifyToken, rutin.save_checkout);
//.. search rutin ...//
app.post('/search/:src', rutin.search_rutins);

//... priode add...//
app.post('/add_priode/:rutin_id', verifyToken, priode.add_priode);

//
app.post('/all_priode/:rutin_id', priode.all_priode);



//....... cap 10 .....//
app.post('/cap10/add/', verifyToken, cp10.addCap10);

module.exports = app;