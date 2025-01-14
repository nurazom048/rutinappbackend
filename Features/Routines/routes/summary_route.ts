import express from 'express';
import multer from 'multer';
import { addSummary, saveUnsaveSummary, summary_status, get_class_summary_list, removeSummary } from '../controllers/summary_controller';
import { verifyToken } from '../../../services/Authentication/helper/Authentication';
import { validateSummaryAddRequest } from '../middleware/routines.middleware';
import { summaryAddPermission, summaryModificationPermission } from '../middleware/permission.routine.mid';

const app = express();

// Set up multer with the storage
const upload = multer({
    storage: multer.memoryStorage(),
    //limits: { fileSize: 5 * 1024 * 1024 }
});

// 1 add summary
app.post("/add/:classID", upload.array('imageLinks', 12), verifyToken, validateSummaryAddRequest, summaryAddPermission, addSummary);
app.delete("/:summaryID", verifyToken, summaryModificationPermission, removeSummary);


app.post("/save", verifyToken, saveUnsaveSummary);// save
app.post("/status/:summaryID", verifyToken, summary_status);
// app.post("/edit/:summaryID", verifyToken, update_summary);

// 2 summary
app.get("/:classID", verifyToken, get_class_summary_list);// get class summary
app.get("/", verifyToken, get_class_summary_list);// get saved summary

export default app;
