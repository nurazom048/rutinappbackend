const path = require('path');
const express = require('express');
const app = express();
const verifyToken = require("../varifitoken");
const ac = require("../controllers/account_controllers");
const multer = require('multer');
const fs = require('fs');

// Define the storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null,  './upload/image/cover');
  },
  filename: (req, file , callBack) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    callBack(null, uniqueSuffix + "_" + file.originalname);
  }
});

// Set up multer with the storage
const upload = multer({storage: storage});

// Route to update the account with an image
app.post("", verifyToken, upload.single("image"), ac.edit_account);

app.get('/image/:filename', (req, res) => {
  const imagePath = path.join(__dirname, '../upload/image/cover', req.params.filename);
console.log(imagePath);
  // Check if the file exists
  if (!fs.existsSync(imagePath)) {
    return res.status(404).send('Image not found');
  }

  // Set the Content-Type header
  res.setHeader('Content-Type', 'image/jpeg');

  // Send the file as a response
  fs.createReadStream(imagePath).pipe(res);
});


module.exports = app;       