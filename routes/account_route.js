const express = require('express');
const app = express();
const verifyToken = require("../varifitoken");
const ac = require("../controllers/account_controllers");
const multer = require('multer');




// Set up multer with the storage
const upload = multer({
  storage: multer.memoryStorage(),
  // limits: {
  //   fileSize: 5 * 1024 * 1024 // 5 MB limit
  // }
});


//... Eddit account....///
app.post("/eddit", verifyToken,upload.single('image'),  ac.edit_account);









module.exports = app;       