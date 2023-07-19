import express from 'express';
const router = express.Router();
import verifyToken from "../controllers/Auth/helper/varifitoken";
const ac = require("../controllers/Account Controllers/account_controllers");
import multer from 'multer';

// Set up multer with the storage
const upload = multer({
  storage: multer.memoryStorage(),
  // limits: {
  //   fileSize: 5 * 1024 * 1024 // 5 MB limit
  // }
});

//... Edit account....///
router.post("/eddit", verifyToken, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'image', maxCount: 1 }]), ac.edit_account);

router.post("/eddit/changepassword/", verifyToken, ac.changePassword);
// later add security
router.post("/eddit/forgotPassword/", ac.forgetPassword);

router.route("/").post(verifyToken, upload.single('image'), ac.view_my_account);
router.route("/:username").post(ac.view_others_Account);

router.route("/find").get(ac.searchAccounts); // search account

export default router;
