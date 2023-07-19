"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const varifitoken_1 = __importDefault(require("../controllers/Auth/helper/varifitoken"));
const ac = require("../controllers/Account Controllers/account_controllers");
const multer_1 = __importDefault(require("multer"));
// Set up multer with the storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    // limits: {
    //   fileSize: 5 * 1024 * 1024 // 5 MB limit
    // }
});
//... Edit account....///
router.post("/eddit", varifitoken_1.default, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'image', maxCount: 1 }]), ac.edit_account);
router.post("/eddit/changepassword/", varifitoken_1.default, ac.changePassword);
// later add security
router.post("/eddit/forgotPassword/", ac.forgetPassword);
router.route("/").post(varifitoken_1.default, upload.single('image'), ac.view_my_account);
router.route("/:username").post(ac.view_others_Account);
router.route("/find").get(ac.searchAccounts); // search account
exports.default = router;
