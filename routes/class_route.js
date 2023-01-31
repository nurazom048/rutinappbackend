
const express = require('express')
const app = express()
const verifyToken = require("../varifitoken")
const classs = require("../controllers/class_controllers")




app.post('/:rutin_id/addclass',verifyToken, classs.create_class);









module.exports = app;