const express = require('express');
const app = express();
const verifyToken = require("../varifitoken");
const ac = require("../controllers/account_controllers");
const multer = require('multer');
const varifitoken = require('../varifitoken');




// Set up multer with the storage
const upload = multer({
  storage: multer.memoryStorage(),
  // limits: {
  //   fileSize: 5 * 1024 * 1024 // 5 MB limit
  // }
});


//... Eddit account....///
app.post("/eddit", verifyToken, upload.single('image'), ac.edit_account);

//... Eddit account....///
app.post("/view_others/:username", varifitoken, ac.view_account);
app.post("/:username", ac.view_others_account);// foe view others account 



app.post("/accounts/find", ac.getAccounts);


module.exports = app;       