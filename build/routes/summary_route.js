"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const summary_controller_1 = require("../controllers/Routines/summary_controller");
const varifitoken_1 = require("../controllers/Auth/helper/varifitoken");
const app = (0, express_1.default)();
// Set up multer with the storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    //limits: { fileSize: 5 * 1024 * 1024 }
});
// 1 add summary
app.post("/add/:class_id", upload.array('imageLinks', 12), varifitoken_1.verifyToken, summary_controller_1.create_summary);
app.delete("/:summary_id", varifitoken_1.verifyToken, summary_controller_1.remove_summary);
// save
app.post("/save", varifitoken_1.verifyToken, summary_controller_1.saveUnsaveSummary);
app.post("/eddit/:summary_id", varifitoken_1.verifyToken, summary_controller_1.update_summary);
app.post("/status/:summary_id", varifitoken_1.verifyToken, summary_controller_1.summary_status);
// 2 summary
app.get("/:class_id", varifitoken_1.verifyToken, summary_controller_1.get_class_summary_list);
app.get("/", varifitoken_1.verifyToken, summary_controller_1.get_class_summary_list);
exports.default = app;
