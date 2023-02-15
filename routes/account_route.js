const path = require('path');
const express = require('express');
const app = express();
const verifyToken = require("../varifitoken");
const ac = require("../controllers/account_controllers");

//
const multer = require('multer');


//
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // the destination folder for uploaded files
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
      cb(null, file.fieldname + '-' + uniqueSuffix); // the filename format for uploaded files
    }
  })
});

// update account with image
app.post("/eddit", upload.single('image'), verifyToken, ac.eddit_account);





module.exports = app;       