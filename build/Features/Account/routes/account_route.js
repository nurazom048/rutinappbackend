"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const account_controllers_1 = require("../controllers/account_controllers");
const multer_1 = __importDefault(require("multer"));
const Authentication_1 = require("../../../services/Authentication/helper/Authentication");
// Set up multer with the storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    // limits: {
    //   fileSize: 5 * 1024 * 1024 // 5 MB limit
    // }
});
//**********************************************************************************************/
// --------------------------------- Account Routes --------------------------------------------/
//**********************************************************************************************/
//... Edit account....///
router.post("/eddit", Authentication_1.verifyToken, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'image', maxCount: 1 }]), account_controllers_1.edit_account);
router.post("/edit/change_password/", Authentication_1.verifyToken, account_controllers_1.changePassword);
// later add security
router.post("/eddit/forgotPassword/", account_controllers_1.forgetPassword);
router.route("/").post(Authentication_1.verifyToken, upload.single('image'), account_controllers_1.view_my_account);
router.route("/:username").post(account_controllers_1.view_others_Account);
router.route("/find").get(account_controllers_1.searchAccounts); // search account
exports.default = router;
