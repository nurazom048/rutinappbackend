const Account = require('../models/Account');


//? firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_stroage = require("../config/firebase_stroges");

// Initialize Firebase
initializeApp(firebase_stroage.firebaseConfig);

// Get a reference to the Firebase storage bucket
const storage = getStorage();
// const pdfRef = ref(storage, 'notice/pdf');

// Firebase auth
const admin = require('firebase-admin');
const { auth } = require("firebase-admin");


let imageRef;

// Account controller to update the account with an image
exports.edit_account = async (req, res) => {
  console.log(req.body)
  console.log(req.file)
  const { name, username, about, email } = req.body;

  try {
    const account = await Account.findOne({ _id: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    const oldImageURL = account.image;
    const oldImagePATH = oldImageURL.split('/').pop().split('?')[0].replaceAll('%', '/').replaceAll('/2F', '/');
    console.log("oldImagePATH")

    console.log(oldImagePATH)
    const oldImageRef = ref(storage, oldImagePATH);
    // console.log(oldImageRef);


    if (req.file) {
      const timestamp = Date.now();
      const filename = `${account.username}-${account.name}-${timestamp}-${req.file.originalname}`;
      const metadata = { contentType: req.file.mimetype };

      const time = Date.now();
      imageRef = ref(storage, `images/profile_picture/ID-${account.id}/-${filename}`);

      await uploadBytes(imageRef, req.file.buffer, metadata);
      const url = await getDownloadURL(imageRef);
      //DELETE: old image from firebade

      if (account.image) {
        await deleteObject(oldImageRef);
      }


      const update = await Account.findOneAndUpdate(
        { _id: req.user.id },
        { name, image: url, username, about: about },
        { new: true }
      );
      console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%')

      console.log(update)
      return res.status(200).json({ message: 'Account updated successfully', update });
    }

    const update = await Account.findOneAndUpdate(
      { _id: req.user.id },
      { name, username, about: about },
      { new: true }
    );

    return res.status(200).json({ message: 'Account updated successfully', update });
  } catch (err) {
    console.error(err);

    if (req.file) {
      if (imageRef) {
        await deleteObject(imageRef);
      }
    }

    return res.status(500).json({ message: 'Failed to update account', error: err });
  }
};

//.......... Search Account ....//

exports.searchAccounts = async (req, res) => {
  const { q: searchQuery = '', page = 1, limit = 10 } = req.query;
  console.log("search ac");
  console.log(req.query);

  try {
    const regex = new RegExp(searchQuery, 'i');
    const count = await Account.countDocuments({ username: { $regex: regex } });
    const accounts = await Account.find({ username: { $regex: regex } })
      .select('_id username name image')
      .limit(limit)
      .skip((page - 1) * limit);

    if (!accounts) {
      return res.status(404).send({ message: 'Not found' });
    }

    res.status(200).json({
      accounts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalCount: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//........ View my account ...//
exports.view_my_account = async (req, res) => {


  try {
    const user = await Account.findOne({ _id: req.user.id },).select('-Saved_routines -routines -__v');

    console.error(user);
    if (!user) return res.status(404).json({ message: "Account not found" });


    return res.status(200).json(user);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }

}


//....view others Account...//

exports.view_others_Account = async (req, res) => {

  const { username } = req.params;

  try {
    const user = await Account.findOne({ username }, { password: 0 })
      .populate({
        path: 'routines Saved_routines',
        options: {
          sort: { createdAt: -1 },
        },
        populate: {
          path: 'ownerid',
          select: 'name username image',
        },
      });


    if (!user) return res.status(404).json({ message: "User id not found " });

    return res.status(200).json(user.toObject({ getters: true }));

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting routines" });
  }
};



// *****************     changePassword      *******************************/
exports.changePassword = async (req, res) => {
  const { id } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    // Find the account by ID
    const account = await Account.findById(id);
    if (!account) {
      return res.status(400).json({ message: "Account not found" });
    }

    // Compare old password
    if (oldPassword !== account.password) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Update the password on Firebase
    await auth().updateUser(account.id, {
      password: newPassword
    });

    // Update the password in MongoDB
    account.password = newPassword;
    await account.save();

    // Send response
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error changing password" });
  }
};





// *****************     forgetPassword      *******************************/
exports.forgetPassword = async (req, res) => {
  const { email, phone, newPassword } = req.body;

  try {
    if (!email || !newPassword) return res.status(400).json({ message: "Please fill the form" });

    // Find the account by ID
    const account = await Account.findOne({ $or: [{ email: email }, { phone: phone }] });
    if (!account) return res.status(400).json({ message: "Account not found" });



    // Update the password
    account.password = newPassword;
    // // Update the password on Firebase
    await auth().updateUser(account.id, {
      password: newPassword
    });

    await account.save();

    // Send response
    res.status(200).json({ message: "Password changed successfully" });
    console.error({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error changing password" });
  }
};
