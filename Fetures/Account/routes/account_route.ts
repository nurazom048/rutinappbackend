import express from 'express';
const router = express.Router();
import { edit_account, changePassword, forgetPassword, view_my_account, view_others_Account, searchAccounts } from "../../Account/controllers/account_controllers";
import multer from 'multer';
import { verifyToken } from '../../../services/Authantication/helper/varifitoken';

// Set up multer with the storage
const upload = multer({
  storage: multer.memoryStorage(),
  // limits: {
  //   fileSize: 5 * 1024 * 1024 // 5 MB limit
  // }
});


//**********************************************************************************************/
// --------------------------------- Account Routes --------------------------------------------/
//**********************************************************************************************/
//... Edit account....///
router.post("/eddit", verifyToken, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'image', maxCount: 1 }]), edit_account);

router.post("/eddit/changepassword/", verifyToken, changePassword);
// later add security
router.post("/eddit/forgotPassword/", forgetPassword);

router.route("/").post(verifyToken, upload.single('image'), view_my_account);
router.route("/:username").post(view_others_Account);

router.route("/find").get(searchAccounts); // search account

export default router;
