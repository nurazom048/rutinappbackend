
// Firebase admin sdk from Firebase config
import admin from 'firebase-admin';
const serviceAccount = require('../../../config/firebase/admin.sdk');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
const firebaseApp = require('../../../config/firebase/firebase.config');
const auth = getAuth(firebaseApp);

//
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateAuthToken, generateRefreshToken } from '../helper/Jwt.helper';
import PendingAccount from '../../../Features/Account/models/pending_account.model';
import { maineDB } from '../../../prisma/mongodb.connection';
import prisma from '../../../prisma/schema/prisma.clint';

//**********************************************************************************************/
// --------------------------------- login Account --------------------------------------------/
//**********************************************************************************************/
export const loginAccount = async (req: Request, res: Response) => {
  const { username, password, email, oneSignalUserId } = req.body;

  try {
    let account = null;
    let accountData = null;

    // Step 1: Check for pending account status
    const pendingAccount = await PendingAccount.findOne({ $or: [{ username }, { email }] });
    if (pendingAccount) {
      const pendingAccountCredential = await admin.auth().getUserByEmail(pendingAccount.email);

      // Verify email status
      if (!pendingAccountCredential.emailVerified) {
        return res.status(401).json({
          message: "Email is not verified",
          account: { email: pendingAccount.email },
        });
      }

      if (!pendingAccount.isAccept) {
        return res.status(402).json({
          message: "Academy request is pending",
          account: { email: pendingAccount.email },
        });
      }
    }

    // Step 2: Find account by username or email
    if (username) {
      account = await prisma.account.findUnique({ where: { username } });
    } else if (email) {
      accountData = await prisma.accountData.findFirst({
        where: { email },
        include: { accountID: true },
      });

      if (accountData) {
        account = accountData.accountID;
      }
    }

    // Step 3: Handle if no account found
    if (!account) {
      return res.status(400).json({ message: "User not found" });
    }

    // Step 4: Check for Google Sign-In
    if (accountData?.googleSignIn) {
      return res.status(400).json({ message: "Try to continue with Google" });
    }

    // Step 5: Verify password
    const passwordMatch = await bcrypt.compare(password, accountData?.password || "");
    if (!passwordMatch) return res.status(400).json({ message: "Incorrect password" });

    // Step 6: Ensure accountData is not null for Firebase sign-in
    if (!accountData || !accountData.email) {
      return res.status(400).json({ message: "Account data is missing or incomplete" });
    }

    // Firebase sign-in to verify email
    const userCredential = await signInWithEmailAndPassword(auth, accountData.email, password);
    if (!userCredential.user.emailVerified) {
      return res.status(401).json({ message: "Email is not verified", email: userCredential.user.email });
    }

    // Step 7: Generate JWT tokens
    const authToken = generateAuthToken(account.id, account.username);
    const refreshToken = generateRefreshToken(account.id, account.username);

    // Set tokens in headers
    res.setHeader("Authorization", `Bearer ${authToken}`);
    res.setHeader("x-refresh-token", refreshToken);

    // Step 8: Update last login time and store hashed password
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.account.update({
      where: { id: account.id },
      data: { lastLoginTime: new Date() },
    });

    await prisma.accountData.update({
      where: { ownerAccountId: account.id },
      data: {
        oneSignalUserId,
        password: hashedPassword,
      },
    });

    // Step 9: Send success response with email
    res.status(200).json({
      message: "Login successful",
      authToken,
      refreshToken,
      account: {
        ...account,
        accountData: { email: accountData.email },
      },
    });

  } catch (error: any) {
    console.error("Login error:", error);

    if (error.code === "auth/wrong-password") {
      return res.status(400).json({ message: "Wrong password" });
    }

    if (error.code === "auth/invalid-email") {
      return res.status(400).json({ message: "Invalid email" });
    }

    return res.status(500).json({ message: `Error logging in: ${error.message}` });
  }
};


//**********************************************************************************************/
// --------------------------------- Create Account --------------------------------------------/
//**********************************************************************************************/


export const createAccount = async (req: Request, res: Response) => {
  const { name, username, password, phone, email, accountType } = req.body;
  console.log('create account ');
  //start a session
  const session = await maineDB.startSession();
  session.startTransaction();
  try {
    // Start a transaction for creating account and account data
    const result = await prisma.$transaction(async (prisma) => {

      // Handle academy-specific request if applicable
      if (accountType === "academy") {
        const pendingRequestResult = await createPendingRequest(req, res, session); // Assuming defined elsewhere
        return res.status(200).json(pendingRequestResult);
      }

      // Encrypt password if provided
      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

      // Create the account in the `Account` model
      const createdAccount = await prisma.account.create({
        data: {
          name,
          username,
          accountType,

        },
      });

      // Create related data in the `AccountData` model
      const createdAccountData = await prisma.accountData.create({
        data: {
          phone,
          email,
          password: hashedPassword,
          ownerAccountId: createdAccount.id,
          googleSignIn: false,

        },
      });

      // Check if the email already exists in Firebase
      try {
        await admin.auth().getUserByEmail(email);
        throw new Error("auth/email-already-in-use");
      } catch (error: any) {
        if (error.code !== "auth/user-not-found") {
          throw error;
        }
      }

      // Create Firebase user account
      const firebaseAuthCreate = await admin.auth().createUser({
        displayName: name,
        uid: createdAccount.id,
        email,
        password: password || undefined,
        emailVerified: false,
      });

      return {
        message: "Account created successfully",
        createdAccount,
        createdAccountData,
        firebaseAuthCreate,
      };
    });
    console.log(result)
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error creating account:", error);

    // Handle errors gracefully
    const errorMessage =
      error.code === "auth/invalid-email"
        ? "Invalid email"
        : error.code === "auth/email-already-in-use"
          ? "Email already taken"
          : error.code === "auth/weak-password"
            ? "Weak password"
            : `Error creating account: ${error.message}`;

    res.status(400).json({ message: errorMessage });
  }
};
// Create the createPendingRequest function
const createPendingRequest = async (req: Request, res: Response, session: mongoose.ClientSession) => {
  const { name, username, password, phone, email, accountType, contractInfo } = req.body;

  if (!contractInfo) return { message: 'contractInfo is required' };

  const emailAlreadyUsed = await PendingAccount.findOne({ email }).session(session);
  if (emailAlreadyUsed) return { message: "Request already pending with this email" };





  // Encrypt the new password
  const hashedPassword = await bcrypt.hash(password, 10);

  const account = new PendingAccount({
    name,
    username,
    password: hashedPassword,
    phone,
    email,
    account_type: accountType,
    contractInfo,

  });

  const firebaseAuthCreate = await admin.auth().createUser({
    displayName: account.name,
    uid: account.id,
    email: email,
    password: password,
    emailVerified: false,
  });

  const createdAccount = await account.save({ session });

  return { message: "Request sent successfully", createdAccount, firebaseAuthCreate };
};






// //***********   deleteAccount       **********/
// export const deleteAccount = async (req:any, res:a) => {
//   const { id } = req.params;

//   try {
//     console.log(req.user);
//     const findAccount = await Account.findById(id);
//     if (!findAccount) return res.status(400).json({ message: "Account not found" });
//     if (findAccount.id, toString() !== req.user.id) returnres.status(400).json({ message: " you can only delete your  Account " });
//     // Send any
//     console.log(findAccount._id);

//     // findAccount.delete();
//     res.status(200).json({ message: "Account deleted successfully" });


//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({ message: "Error deleting account" });
//   }
// };


// //************** rejectPending ********************* */
// export const rejectPending = async (req: any, res: any) => {
//   const { id } = req.params;

//   try {
//     const account = await PendingAccount.findById(id);
//     if (!account) {
//       return res.status(400).json({ message: "Account not found" });
//     }

//     if (account && account.isAccept !== null) {
//       return res.status(200).json({ message: "Request already accepted" });
//     }

//     // Delete user from Firebase authentication
//     try {
//       await admin.auth().deleteUser(account.id);
//     } catch (error: any) {
//       console.error(error);
//       return res.status(500).json({ message: "Error deleting user from Firebase authentication" });
//     }

//     // Delete account from pending requests
//     await PendingAccount.findByIdAndDelete(id);

//     res.status(200).json({ message: "Account rejected and deleted successfully" });
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({ message: "Error rejecting pending request" });
//   }
// };