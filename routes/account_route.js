const express = require('express');
const router = express.Router();
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
router.post("/eddit", verifyToken, upload.single('image'), ac.edit_account);




router.route("/").post(verifyToken, ac.view_my_account);
router.route("/:username").post(verifyToken, ac.view_others_Account);




router.post("/accounts/find", ac.getAccounts);


module.exports = router;       