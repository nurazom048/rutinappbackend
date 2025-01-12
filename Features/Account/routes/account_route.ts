import express from 'express';
const router = express.Router();
import { edit_account, changePassword, forgetPassword, view_my_account, view_others_Account, searchAccounts } from "../controllers/account_controllers";
import multer from 'multer';
import { verifyToken } from '../../../services/Authentication/helper/Authentication';

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
router.post("/edit", verifyToken, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'image', maxCount: 1 }]), edit_account);
router.post("/edit/change_password/", verifyToken, changePassword);
// later add security
router.post("/edit/forgotPassword/", forgetPassword);

router.route("/").post(verifyToken, upload.single('image'), view_my_account);
router.route("/:username").post(view_others_Account);

router.route("/find").get(searchAccounts); // search account

export default router;
