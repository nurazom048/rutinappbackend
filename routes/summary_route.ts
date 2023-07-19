import express from 'express';
import multer from 'multer';
const summary = require('../controllers/Routines/summary_controller');
import verifyToken from '../controllers/Auth/helper/varifitoken';

const app = express();

// Set up multer with the storage
const upload = multer({
    storage: multer.memoryStorage(),
    //limits: { fileSize: 5 * 1024 * 1024 }
});

// 1 add summary
app.post("/add/:class_id", upload.array('imageLinks', 12), verifyToken, summary.create_summary);
app.delete("/:summary_id", verifyToken, summary.remove_summary);

// save
app.post("/save", verifyToken, summary.saveUnsaveSummary);
app.post("/eddit/:summary_id", verifyToken, summary.update_summary);
app.post("/status/:summary_id", verifyToken, summary.sunnary_status);

// 2 summary
app.get("/:class_id", verifyToken, summary.get_class_summary_list);
app.get("/", verifyToken, summary.get_class_summary_list);

export default app;
