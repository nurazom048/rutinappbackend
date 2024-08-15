import express from 'express';
const router = express.Router();
import { verifyToken } from "../../../services/Authentication/helper/Authentication";
import multer from 'multer';
import { onesignal } from '../../../services/Notification services/oneSignalNotification.controller';
import { createNotification, getAllNotifications, deleteNotification, } from '../controllers/notification.controller';

// Set up multer with the storage
const upload = multer({
    storage: multer.memoryStorage(),
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
router.post("/", upload.single('image'), createNotification);
router.patch("/:notificationId", deleteNotification);
router.get("", getAllNotifications);
router.get("/oneSignal", onesignal);



export default router;
