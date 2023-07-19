"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const varifitoken_1 = __importDefault(require("../controllers/Auth/helper/varifitoken"));
const multer_1 = __importDefault(require("multer"));
const notification_controller_1 = require("../controllers/notification/notification.controller");
// Set up multer with the storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    // limits: {
    //   fileSize: 5 * 1024 * 1024 // 5 MB limit
    // }
});
//... create....///
router.get("/", varifitoken_1.default, upload.single('image'), notification_controller_1.createNotification);
exports.default = router;
