
const express = require('express')
const app = express()
const verifyToken = require("../varifitoken")
const classs = require("../controllers/class_controllers")


// 3 

app.post('/:rutin_id/addclass',verifyToken, classs.create_class);
app.post('/:rutin_id/eddit/:class_id',verifyToken, classs.edit_class);
app.delete('/:rutin_id/delete/:class_id',verifyToken, classs.delete_class);

//
app.get('/:rutin_id/:weekday',classs.show_weekday_classes);







module.exports = app;