"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const varifitoken_1 = require("../controllers/Auth/helper/varifitoken");
const multer_1 = __importDefault(require("multer"));
const notice_controller_1 = require("../controllers/NoticeBoard/notice_controller");
// Set up multer with the storage
const upload = (0, multer_1.default)({
    //limits: { fileSize: 11 * 1024 * 1024 }
    storage: multer_1.default.memoryStorage(),
    // fileFilter: (req, file, cb) => {
    //     if (file.mimetype !== 'application/pdf') {
    //         return cb(new Error('Only PDF files are allowed'), false);
    //     }
    //     cb(null, true);
    // },
});
//.. create update delete
router.route("/add/").post(varifitoken_1.verifyToken, upload.single('pdf_file'), notice_controller_1.addNotice); // add notice 
router.route("/:noticeId").delete(varifitoken_1.verifyToken, notice_controller_1.deleteNotice); //... delete notice
// get notice
//******     check status   ********/ 
router.route("/status/:academyID").post(varifitoken_1.verifyToken, notice_controller_1.current_user_status);
// join and leave notice board
router.route("/join/:academyID").post(varifitoken_1.verifyToken, notice_controller_1.joinNoticeboard);
router.route("/leave/:academyID").delete(varifitoken_1.verifyToken, notice_controller_1.leaveMember);
// status
//notification on off
router.post('/notification/off/:academyID', varifitoken_1.verifyToken, notice_controller_1.notification_Off);
router.post('/notification/on/:academyID', varifitoken_1.verifyToken, notice_controller_1.notification_On);
//******     recent notice   ********/ 
router.route("/recent/").post(varifitoken_1.verifyToken, notice_controller_1.recentNotice);
router.route("/recent/:academyID").post(varifitoken_1.verifyToken, notice_controller_1.recentNoticeByAcademeID);
exports.default = router;
