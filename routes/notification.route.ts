import express from 'express';
const router = express.Router();
import { verifyToken } from "../controllers/Auth/helper/varifitoken";
import multer from 'multer';
import { createNotification } from '../controllers/notification/notification.controller';

// Set up multer with the storage
const upload = multer({
    storage: multer.memoryStorage(),
    // limits: {
    //   fileSize: 5 * 1024 * 1024 // 5 MB limit
    // }
});

//... create....///
router.get("/", verifyToken, upload.single('image'), createNotification);

export default router;
