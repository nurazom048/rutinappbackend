const express = require('express')
const app = express()
const summary = require('../controllers/summary_controller');
const verifyToken = require("../varifitoken")
const multer = require('multer');

//
// Set up multer with the storage
const upload = multer({
    storage: multer.memoryStorage(),
    //limits: { fileSize: 5 * 1024 * 1024 }
});

// 1 add sumary 
app.post("/add/:class_id", upload.array('imageLinks', 12), verifyToken, summary.create_summary);
app.delete("/:summary_id", verifyToken, summary.remove_summary);

// save 
app.post("/save", verifyToken, summary.saveUnsaveSummary);
app.post("/eddit/:summary_id", verifyToken, summary.update_summary);
app.post("/status/:summary_id", verifyToken, summary.sunnary_status);



// 2 sumary
app.get("/:class_id", verifyToken, summary.get_class_summary_list);
app.get("/", verifyToken, summary.get_class_summary_list);





module.exports = app;