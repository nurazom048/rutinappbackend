import Account from '../models/Account.Model';
import bcrypt from 'bcrypt';
import express, { Request, Response } from 'express';

//? firebase
import { initializeApp, getApp } from 'firebase/app';
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
import { firebaseConfig } from "../../../config/firebase/firebase_storage";
import Routine from '../../Routines/models/routine.models';
const storage = getStorage();

// Initialize Firebase
initializeApp(firebaseConfig);



// Firebase auth
const admin = require('firebase-admin');
const { auth } = require("firebase-admin");
// const { use } = require('../../routes/account_route');




// Account controller to update the account with images

export const edit_account = async (req: any, res: Response) => {
  // console.log(req.body);
  // console.log(req.files);
  // console.log("req.body");
  const { name, username, about, email } = req.body;

  try {
    const account = await Account.findOne({ _id: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Handle the cover image
    const coverImage = req.files['cover'] ? req.files['cover'][0] : null;
    let coverImageURL = account.coverImage; // Existing cover image URL
    // 01619904210

    if (coverImage) {
      // Upload the cover image
      const timestamp = Date.now();
      const filename = `${account.username}-${account.name}-${timestamp}-${coverImage.originalname}`;
      const metadata = { contentType: coverImage.mimetype };

      const coverImageRef = ref(storage, `images/profile/ID-${account.id}/cover/-${filename}`);

      await uploadBytes(coverImageRef, coverImage.buffer, metadata);
      coverImageURL = await getDownloadURL(coverImageRef);

      // Delete the old cover image if it exists
      if (account.coverImage) {
        const oldCoverImageRef = ref(storage, account.coverImage);
        await deleteObject(oldCoverImageRef);
      }
    }

    // Handle the profile image
    const profileImage = req.files['image'] ? req.files['image'][0] : null;
    let profileImageURL = account.image; // Existing profile image URL

    if (profileImage) {
      // Upload the profile image
      const timestamp = Date.now();
      const filename = `${account.username}-${account.name}-${timestamp}-${profileImage.originalname}`;
      const metadata = { contentType: profileImage.mimetype };

      const profileImageRef = ref(storage, `images/profile/ID-${account.id}/profile/-${filename}`);

      await uploadBytes(profileImageRef, profileImage.buffer, metadata);
      profileImageURL = await getDownloadURL(profileImageRef);

      // Delete the old profile image if it exists
      if (account.image && !account.googleSignIn) {
        const oldProfileImageRef = ref(storage, account.image);
        await deleteObject(oldProfileImageRef);
      }
    }

    // Update the account with the new image URLs and other fields
    const update = await Account.updateOne(
      { _id: req.user.id },
      {
        name,
        username,
        about,
        email,
        coverImage: coverImageURL,
        image: profileImageURL,
      }
    );

    return res.status(200).json({ message: 'Account updated successfully', update });

  } catch (err) {
    console.error(err);

    // Delete the uploaded images if an error occurs
    // if (req.files) {
    //   const bucket = storage.bucket('your-bucket-name');
    //   if (req.files['cover']) {
    //     const coverImage = bucket.file(`images/cover/${getFilenameFromURL(req.files['cover'][0].originalname)}`);
    //     await coverImage.delete();
    //   }
    //   if (req.files['image']) {
    //     const profileImage = bucket.file(`images/profile/${getFilenameFromURL(req.files['image'][0].originalname)}`);
    //     await profileImage.delete();
    //   }
    // }

    return res.status(500).json({ message: 'Failed to update account', error: err });
  }
};
//.......... Search Account ....//
export const searchAccounts = async (req: any, res: Response) => {
  const { q: searchQuery = '', page = 1, limit = 10 } = req.query;
  // console.log("search ac");
  // console.log(req.query);

  try {
    const regex = new RegExp(searchQuery, 'i');
    const count = await Account.countDocuments({
      $or: [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
        // Add more fields to search here
      ]
    });

    const accounts = await Account.find({
      $or: [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
        // Add more fields to search here
      ]
    })
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//........ View my account ...//
export const view_my_account = async (req: any, res: Response) => {


  try {
    const user = await Account.findOne({ _id: req.user.id },).select('-Saved_routines -routines -__v');

    console.error(user);
    if (!user) return res.status(404).json({ message: "Account not found" });


    return res.status(200).json(user);
  } catch (error: any) {
    return res.status(404).json({ message: error.message });
  }

}


//....view others Account...//
export const view_others_Account = async (req: any, res: Response) => {
  const { username } = req.params;
  console.log(username);

  try {
    const user = await Account.findOne({ username }, { password: 0 })
      .populate({
        path: 'routines Saved_routines',
        model: Routine,
        options: {
          sort: { createdAt: -1 },
        },
        populate: {
          path: 'ownerid',
          model: Account,
          select: 'name username image coverImage',
        },
      });

    if (!user) return res.status(404).json({ message: "User id not found " });

    return res.status(200).json(user.toObject({ getters: true }));

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error getting routines" });
  }
};


// *****************     changePassword      *******************************/
export const changePassword = async (req: any, res: Response) => {
  const { id } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    // Find the account by ID
    const account = await Account.findById(id);
    if (!account) {
      return res.status(400).json({ message: "Account not found" });
    }

    // Compare old password

    // Compare passwords
    const passwordMatch = bcrypt.compare(oldPassword, account.password!);
    if (!passwordMatch && oldPassword != account.password) {
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
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error changing password" });
  }
};





// *****************     forgetPassword      *******************************/
export const forgetPassword = async (req: any, res: Response) => {
  const { email, phone, username } = req.body;

  try {
    if (!email && !username) return res.status(400).json({ message: "Please fill the form" });

    // Find the account by ID
    const account = await Account.findOne({ $or: [{ email: email }, { phone: phone }, { username: username }] });
    if (!account) return res.status(400).json({ message: "username or email is not valid" });



    // Update the password
    // // Update the password on Firebase
    // const User =   await auth().
    // User.

    // await account.save();

    // Send response
    res.status(200).json({ message: "Password changed successfully", email: account.email });
    //console.error({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error changing password" });
  }
};
