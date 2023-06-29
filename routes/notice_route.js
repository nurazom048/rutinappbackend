const express = require('express');
const router = express.Router();
const verifyToken = require("../varifitoken");
const multer = require('multer');
const notice = require("../controllers/NoticeBoard/notice_controller");

// Set up multer with the storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});




//.. create update delete
router.route("/add/").post(verifyToken, upload.single('pdf_file'), notice.addNotice);// add notice 
router.route("/:noticeId").delete(verifyToken, notice.deleteNotice);//... delete notice

// get notice


//******     chack status   ********/ 
router.route("/status/:academyID").post(verifyToken, notice.current_user_status);

// join and leave notice boaed
router.route("/join/:academyID").post(verifyToken, notice.joinNoticeboard);
router.route("/leave/:academyID").delete(verifyToken, notice.leaveMember);
// status
//notification on off
router.post('/notification/off/:academyID', verifyToken, notice.notification_Off);
router.post('/notification/on/:academyID', verifyToken, notice.notification_On);



//******     recent notice   ********/ 
router.route("/recent/").post(verifyToken, notice.recentNotice);
router.route("/recent/:academyID").post(verifyToken, notice.recentNoticeByAcademeID);


module.exports = router;       