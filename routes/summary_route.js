const express = require('express')
const app = express()
const summary = require('../controllers/summary_controller');
const verifyToken = require("../varifitoken")


// 1 add sumary 
app.post("/add/:class_id", verifyToken,summary.create_summary);
app.delete("/delete/:summary_id", verifyToken,summary.remove_summary);
app.post("/eddit/:summary_id", verifyToken,summary.update_summary);

// 2 sumary
app.get("/:class_id", verifyToken,summary.get_class_summary_list);




module.exports = app;