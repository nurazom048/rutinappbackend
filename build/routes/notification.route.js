"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const multer_1 = __importDefault(require("multer"));
const oneSignalNotification_controller_1 = require("../controllers/notification/oneSignalNotification.controller");
const notification_controller_1 = require("../controllers/notification/notification.controller");
// Set up multer with the storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    // limits: {
    //   fileSize: 5 * 1024 * 1024 // 5 MB limit
    // }
});
//****************************************************************************/
//
//........................... Notification ...................................//
//
//****************************************************************************/
// router.get("/", verifyToken, upload.single('image'), createNotification);
router.post("/", upload.single('image'), notification_controller_1.createNotification);
router.patch("/:notificationId", notification_controller_1.deleteNotification);
router.get("", notification_controller_1.getAllNotifications);
router.get("/oneSignal", oneSignalNotification_controller_1.onesignal);
exports.default = router;
