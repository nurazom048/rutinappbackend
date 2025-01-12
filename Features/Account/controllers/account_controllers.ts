import Account from '../models/Account.Model';
import bcrypt from 'bcrypt';
import express, { Request, Response } from 'express';

//? firebase
import { initializeApp, getApp } from 'firebase/app';
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
import { firebaseConfig } from "../../../config/firebase/firebase_storage";
import Routine from '../../Routines/models/routine.models';
import prisma from '../../../prisma/schema/prisma.clint';
const storage = getStorage();

// Initialize Firebase
initializeApp(firebaseConfig);



// Firebase auth
const admin = require('firebase-admin');
const { auth } = require("firebase-admin");
// const { use } = require('../../routes/account_route');



//**********************************************************************************************/
// ---------------------------------Edit Account --------------------------------------------/
//**********************************************************************************************/


export const edit_account = async (req: any, res: Response) => {
  const { name, username, about, email } = req.body;

  try {
    // Step 1: Fetch the current account details
    const account = await prisma.account.findUnique({ where: { id: req.user.id } });
    if (!account) return res.status(404).json({ message: 'Account not found' });


    // Step 2: Handle the cover image update
    const coverImage = req.files?.['cover'] ? req.files['cover'][0] : null;
    let coverImageURL = account.coverImage;
    let coverImageProvider = account.coverImageStorageProvider || null;

    if (coverImage) {
      // Upload the cover image to Firebase Storage
      const timestamp = Date.now();
      const filename = `${account.username}-${account.name}-${timestamp}-${coverImage.originalname}`;
      const metadata = { contentType: coverImage.mimetype };
      const coverImageRef = ref(storage, `images/profile/ID-${account.id}/cover/-${filename}`);

      await uploadBytes(coverImageRef, coverImage.buffer, metadata);
      coverImageURL = await getDownloadURL(coverImageRef);
      coverImageProvider = 'firebase';

      // Delete the old cover image if it exists
      if (account.coverImage && account.coverImageStorageProvider === 'firebase') {
        const oldCoverImageRef = ref(storage, account.coverImage);
        await deleteObject(oldCoverImageRef).catch(() => console.log('Old cover image not found'));
      }
    } else if (!coverImageURL) {
      // Set cover image provider to null if no image exists
      coverImageProvider = null;
    }

    // Step 3: Handle the profile image update
    const profileImage = req.files?.['image'] ? req.files['image'][0] : null;
    let profileImageURL = account.image;
    let profileImageProvider = account.imageStorageProvider || null;

    if (profileImage) {
      // Upload the profile image to Firebase Storage
      const timestamp = Date.now();
      const filename = `${account.username}-${account.name}-${timestamp}-${profileImage.originalname}`;
      const metadata = { contentType: profileImage.mimetype };
      const profileImageRef = ref(storage, `images/profile/ID-${account.id}/profile/-${filename}`);

      await uploadBytes(profileImageRef, profileImage.buffer, metadata);
      profileImageURL = await getDownloadURL(profileImageRef);
      profileImageProvider = 'firebase';

      // Delete the old profile image if it exists
      if (account.image && account.imageStorageProvider === 'firebase') {
        const oldProfileImageRef = ref(storage, account.image);
        await deleteObject(oldProfileImageRef).catch(() => console.log('Old profile image not found'));
      }
    } else if (!profileImageURL) {
      // Set profile image provider to null if no image exists
      profileImageProvider = null;
    }

    // Step 4: Update account details in the database
    const updatedAccount = await prisma.account.update({
      where: { id: req.user.id },
      data: {
        name,
        username,
        about,
        coverImage: coverImageURL,
        coverImageStorageProvider: coverImageProvider,
        image: profileImageURL,
        imageStorageProvider: profileImageProvider,
      },
    });

    return res.status(200).json({
      message: 'Account updated successfully',
      updatedAccount,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update account', error: err });
  }
};



//**********************************************************************************************/
// ---------------------------------Search Account--------------------------------------------/
//**********************************************************************************************/
export const searchAccounts = async (req: any, res: Response) => {
  const { q: searchQuery = '', page = 1, limit = 10 } = req.query;

  try {
    // Ensure pagination values are numbers
    const currentPage = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;

    // Prepare search conditions for username and name
    const searchConditions: any = searchQuery
      ? {
        OR: [
          { username: { contains: searchQuery, mode: 'insensitive' } },
          { name: { contains: searchQuery, mode: 'insensitive' } },
        ],
      }
      : {};

    // Count total matching accounts
    const totalCount = await prisma.account.count({
      where: searchConditions,
    });

    // Fetch paginated results
    const accounts = await prisma.account.findMany({
      where: searchConditions,
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    });

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'No accounts found' });
    }

    // Respond with paginated results
    res.status(200).json({
      accounts,
      currentPage,
      totalPages: Math.ceil(totalCount / pageSize),
      totalCount,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Failed to search accounts', error: error.message });
  }
};



//........ View my account ...//
export const view_my_account = async (req: any, res: Response) => {
  try {
    // Fetch user account data
    const user = await prisma.account.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        about: true,
        isVerified: true,
        image: true,
        imageStorageProvider: true,
        coverImage: true,
        coverImageStorageProvider: true,
        accountType: true,
        lastLoginTime: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: "Account not found" });

    // Remove null fields from the response
    const filteredUser = Object.fromEntries(
      Object.entries(user).filter(([_, value]) => value !== null)
    );

    return res.status(200).json(filteredUser);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};



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

//************************************************************************** */
// ---------------------    changePassword   --------------------------------/
//************************************************************************** */


export const changePassword = async (req: any, res: Response) => {
  const { id } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    // Step 1: Find the account by ID
    const account = await Account.findById(id);
    if (!account) {
      return res.status(400).json({ message: "Account not found" });
    }

    // Ensure the password is defined
    if (!account.password) {
      return res.status(400).json({ message: "Password not set for this account" });
    }

    // Step 2: Compare old password
    const passwordMatch = await bcrypt.compare(oldPassword, account.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Step 3: Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password on Firebase
    await auth().updateUser(account.id, {
      password: newPassword
    });

    // Update the password in MongoDB
    account.password = hashedPassword;
    await account.save();

    // Step 4: Send response
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
