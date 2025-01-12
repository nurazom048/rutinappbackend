import express from 'express';
const router = express.Router();
import { verifyToken } from "../../../services/Authentication/helper/Authentication";
import multer from 'multer';
import {
    addNotice,
    deleteNotice,
    current_user_status,
    joinNoticeboard,
    leaveMember,
    notification_Off,
    notification_On,
    recentNotice,
    recentNoticeByAcademeID
} from "../controllers/notice_controller";
import { checkAccountType } from '../middleware/notice.middleware'

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

// add notice 
router.route("/add/").post(verifyToken, checkAccountType, upload.single('pdf_file'), addNotice);
router.route("/:noticeId").delete(verifyToken, deleteNotice);//... Delete notice


// get notice

//******     check status   ********/ 
router.route("/status/:academyID").post(verifyToken, current_user_status);

// join and leave notice board
router.route("/join/:academyID").post(verifyToken, joinNoticeboard);
router.route("/leave/:academyID").delete(verifyToken, leaveMember);
// status
//notification on off
router.post('/notification/off/:academyID', verifyToken, notification_Off);
router.post('/notification/on/:academyID', verifyToken, notification_On);

//******     recent notice   ********/ 
router.route("/recent/").post(verifyToken, recentNotice);
router.route("/recent/:academyID").post(verifyToken, recentNoticeByAcademeID);

export default router;
