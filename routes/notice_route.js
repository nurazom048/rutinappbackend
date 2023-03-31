const express = require('express');
const router = express.Router();
const verifyToken = require("../varifitoken");
const ac = require("../controllers/account_controllers");
const multer = require('multer');
const notice = require("../controllers/notice_controller");




// Set up multer with the storage
const upload = multer({
    storage: multer.memoryStorage(),
    // limits: {
    //   fileSize: 5 * 1024 * 1024 // 5 MB limit
    // }
});

router.route("/getContent/:noticeId").get(ac.allContent);//... get all notice
router.route("/getAll/:username").get(ac.add_content);//... get all notice

router.route("/add/:noticeId").post(verifyToken, upload.single('pdf_file'), ac.add_content);//... add content


//... Eddit account....///
router.post("/eddit", verifyToken, upload.single('image'), ac.edit_account);

router.route("/create/").post(verifyToken, notice.create_notice);//... create notice
router.route("/delete/:noticeId").delete(verifyToken, notice.deleteNotice);//... delete notice



router.route("/").post(verifyToken, ac.view_my_account);//... view notice
router.route("/:username").post(ac.view_others_Account);//... view notice others account


router.route("/find").get(ac.searchAccounts);//find notice





module.exports = router;       