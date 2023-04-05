const express = require('express');
const router = express.Router();
const verifyToken = require("../varifitoken");
const multer = require('multer');
const notice = require("../controllers/notice_controller");

// Set up multer with the storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});




//.. create update delete
router.route("/create/").post(verifyToken, notice.create_notice);//... create notice
router.route("/delete/:noticeId").delete(verifyToken, notice.deleteNotice);//... delete notice
router.route("/:username").get(notice.viewNoticeByUsername);//... 

// add content 
router.route("/add/:noticeId").post(verifyToken, upload.single('pdf_file'), notice.add_content);//... add content
router.route("/view/content/:contentId").post(notice.viewContent);//... add content




//?... get notice...//
router.route("/getContent/:noticeId").get(notice.allContent);//... get all notice
//router.route("/getAll/:username").get(ac.add_content);//... get all notice





// router.route("/").post(verifyToken, ac.view_my_account);//... view notice
// router.route("/:username").post(ac.view_others_Account);//... view notice others account


// router.route("/find").get(ac.searchAccounts);//find notice





module.exports = router;       