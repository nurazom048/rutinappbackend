import express from 'express';
const router = express.Router();
import { verifyToken } from "../controllers/Auth/helper/varifitoken";
import multer from 'multer';
import { createNotification, getAllNotifications, deleteNotification, } from '../controllers/notification/notification.controller';
import { onesignal } from '../controllers/notification/oneSignalNotification.controller';

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
router.post("/notification", upload.single('image'), createNotification);
router.patch("/notification/:notificationId", deleteNotification);
router.get("/notification/", getAllNotifications);
router.get("/oneSignal", onesignal);



export default router;
