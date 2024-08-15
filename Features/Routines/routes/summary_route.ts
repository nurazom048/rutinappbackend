import express from 'express';
import multer from 'multer';
import {
    create_summary, remove_summary, saveUnsaveSummary,
    update_summary, summary_status, get_class_summary_list,
} from '../controllers/summary_controller';
import { verifyToken } from '../../../services/Authentication/helper/Authentication';

const app = express();

// Set up multer with the storage
const upload = multer({
    storage: multer.memoryStorage(),
    //limits: { fileSize: 5 * 1024 * 1024 }
});

// 1 add summary
app.post("/add/:class_id", upload.array('imageLinks', 12), verifyToken, create_summary);
app.delete("/:summary_id", verifyToken, remove_summary);

// save
app.post("/save", verifyToken, saveUnsaveSummary);
app.post("/eddit/:summary_id", verifyToken, update_summary);
app.post("/status/:summary_id", verifyToken, summary_status);

// 2 summary
app.get("/:class_id", verifyToken, get_class_summary_list);
app.get("/", verifyToken, get_class_summary_list);

export default app;
