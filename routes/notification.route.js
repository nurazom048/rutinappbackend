const express = require('express');
const router = express.Router();
const verifyToken = require("../varifitoken");
const multer = require('multer');
const createNotification = require('../controllers/notification/notification.controller');




// Set up multer with the storage
const upload = multer({
    storage: multer.memoryStorage(),
    // limits: {
    //   fileSize: 5 * 1024 * 1024 // 5 MB limit
    // }
});


//... create....///
router.get("/", upload.single('image'), createNotification.createNotification);





module.exports = router;       