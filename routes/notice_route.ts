import express from 'express';
const router = express.Router();
import verifyToken from "../controllers/Auth/helper/varifitoken";
import multer from 'multer';
const notice = require("../controllers/NoticeBoard/notice_controller");

// Set up multer with the storage
const upload = multer({
    //limits: { fileSize: 11 * 1024 * 1024 }
    storage: multer.memoryStorage(),
    // fileFilter: (req, file, cb) => {
    //     if (file.mimetype !== 'application/pdf') {

    //         return cb(new Error('Only PDF files are allowed'), false);
    //     }
    //     cb(null, true);
    // },
});

//.. create update delete
router.route("/add/").post(verifyToken, upload.single('pdf_file'), notice.addNotice);// add notice 
router.route("/:noticeId").delete(verifyToken, notice.deleteNotice);//... delete notice

// get notice

//******     check status   ********/ 
router.route("/status/:academyID").post(verifyToken, notice.current_user_status);

// join and leave notice board
router.route("/join/:academyID").post(verifyToken, notice.joinNoticeboard);
router.route("/leave/:academyID").delete(verifyToken, notice.leaveMember);
// status
//notification on off
router.post('/notification/off/:academyID', verifyToken, notice.notification_Off);
router.post('/notification/on/:academyID', verifyToken, notice.notification_On);

//******     recent notice   ********/ 
router.route("/recent/").post(verifyToken, notice.recentNotice);
router.route("/recent/:academyID").post(verifyToken, notice.recentNoticeByAcademeID);

export default router;
