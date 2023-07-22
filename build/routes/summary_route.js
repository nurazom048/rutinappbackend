"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const summary = require('../controllers/Routines/summary_controller');
const varifitoken_1 = require("../controllers/Auth/helper/varifitoken");
const app = (0, express_1.default)();
// Set up multer with the storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    //limits: { fileSize: 5 * 1024 * 1024 }
});
// 1 add summary
app.post("/add/:class_id", upload.array('imageLinks', 12), varifitoken_1.verifyToken, summary.create_summary);
app.delete("/:summary_id", varifitoken_1.verifyToken, summary.remove_summary);
// save
app.post("/save", varifitoken_1.verifyToken, summary.saveUnsaveSummary);
app.post("/eddit/:summary_id", varifitoken_1.verifyToken, summary.update_summary);
app.post("/status/:summary_id", varifitoken_1.verifyToken, summary.sunnary_status);
// 2 summary
app.get("/:class_id", varifitoken_1.verifyToken, summary.get_class_summary_list);
app.get("/", varifitoken_1.verifyToken, summary.get_class_summary_list);
exports.default = app;
