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
router.route("/create/").post(verifyToken, notice.create_notice_board);
//router.route("/delete/:noticeId").delete(verifyToken, notice.deleteNotice);//... delete notice
router.route("/:username").get(notice.viewNoticeByUsername);

// add notice 
router.route("/add/:noticeId").post(verifyToken, upload.single('pdf_file'), notice.addNotice);
router.route("/view/content/:noticeId").post(notice.viewNoticeById);


// send request to add notice

router.route("/sendRequest/:noticeBoardId").post(verifyToken, notice.sendRequest);
router.route("/unSendRequest/:noticeBoardId").post(verifyToken, notice.unsendRequest);
router.route("/acceptRequest/:noticeBoardId/:userId").post(verifyToken, notice.acceptRequest);

// see all request 

router.route("/viewRequest/:noticeBoardId").get(notice.seeAllRequest);
// see all joined notice board
router.route("/allJoinedNoticeBoard/").post(verifyToken, notice.seeAllJoinedNoticeBoard);
router.route("/all_notice_board/").post(verifyToken, notice.AllNoticeBoard);// owemer by me
router.route("/recent/").post(verifyToken, notice.seeAllJoinedNoticeBoardNotices);





// //?... get notice...//
// router.route("/getContent/:noticeId").get(notice.allContent);//... get all notice
// //router.route("/getAll/:username").get(ac.add_content);//... get all notice


// router.route("/recent").post(verifyToken, notice.recent_notice);//... get all recent_notice



// router.route("/").post(verifyToken, ac.view_my_account);//... view notice
// router.route("/:username").post(ac.view_others_Account);//... view notice others account


// router.route("/find").get(ac.searchAccounts);//find notice





module.exports = router;       