const express = require('express')
const app = express()
const rutin = require('../controllers/rutin_controllers');
const verifyToken = require("../varifitoken")


// 2 
app.post("/create", verifyToken,rutin.createRutin);
app.delete("/delete/:id", verifyToken,rutin.delete);

//
app.post("/allrutins", verifyToken,rutin.allRutin);






module.exports = app;