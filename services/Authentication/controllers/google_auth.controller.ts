import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose, { ObjectId, isObjectIdOrHexString, isValidObjectId } from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { generateUniqUsername, } from './auth.methods';
import { generateAuthToken, generateRefreshToken, } from '../helper/Jwt.helper';
import { generateAndSetTokens } from '../helper/Authentication';
import PendingAccount from '../../../Features/Account/models/pending_account.model';
import { printD, printError } from '../../../utils/utils';
dotenv.config();





// Firebase admin sdk from Firebase config
import admin from 'firebase-admin';
const serviceAccount = require('../../../config/firebase/admin.sdk');

// Firebase auth from Firebase config
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import prisma from '../../../prisma/schema/prisma.clint';
import { AccountType } from '../../../utils/enum';
const firebaseApp = require('../../../config/firebase/firebase.config');
const auth = getAuth(firebaseApp);


//****************************************************************************************************
// ------------------------------- Continue With Google -----------------------------------------------
//****************************************************************************************************/

export const continueWithGoogle = async (req: Request, res: Response) => {
    const { accountType } = req.body;
    const { user_id: userId, name, picture: image, email: userEmail } = req.body.decodedToken;

    try {

        // Check for pending account approval
        const pendingAccount = await PendingAccount.findOne({ email: userEmail });
        if (pendingAccount && !pendingAccount.isAccept) {
            return res.status(402).json({
                message: "Academy request is pending",
                account: { email: pendingAccount.email },
                pendingAccount
            });
        }

        // Check if user already exists in the system
        const accountData = await prisma.accountData.findUnique({ where: { email: userEmail } });
        const existingUser = accountData ? await prisma.account.findUnique({ where: { id: accountData.ownerAccountId } }) : null;

        if (existingUser && accountData?.googleSignIn) {
            // Generate and set tokens for existing user
            const tokens = generateAndSetTokens(res, existingUser.id, existingUser.username);
            return res.status(200).json({ message: "Login successful", token: tokens.authToken, account: existingUser });
        }

        // Generate a unique username for new user registration
        const username = await generateUniqUsername(userEmail);
        const userExists = await prisma.account.findUnique({ where: { username } });

        if (userExists || accountData) {
            return res.status(401).json({ message: "Account with this username or email already exists." });
        }

        // Validate input data
        if (!userId || !name || !username || !userEmail) {
            return res.status(400).json({ message: "Please fill the form" });
        }

        // Handle academy account requests
        if (accountType === AccountType.academy) {
            const response = await createPendingRequest(req, res, req.body.decodedToken);
            return res.status(201).json(response);
        }

        // Register a new account in the database
        const newAccount = await prisma.account.create({
            data: {
                name,
                image,
                username,
                isVerified: true,
                accountData: {
                    create: { email: userEmail, googleSignIn: true },
                },
            },
        });

        // Update user in Firebase authentication system
        await admin.auth().deleteUser(userId.toString());
        await admin.auth().createUser({
            uid: newAccount.id,
            displayName: name,
            photoURL: image,
            email: userEmail,
            emailVerified: true,
        });

        // Generate and set tokens for the new user
        const tokens = generateAndSetTokens(res, newAccount.id, newAccount.username);

        console.log({ message: "Login successful", token: tokens.authToken, account: newAccount });
        res.status(200).json({ message: "Login successful", token: tokens.authToken, account: newAccount });
    } catch (error) {
        console.error("Error processing Google Auth Token:", (error as any).message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

//............................................................................................//
//............................... createPendingRequest........................................//
//............................................................................................//

const createPendingRequest = async (req: Request, res: Response, decodedToken: any) => {
    const { accountType, contractInfo } = req.body;
    const { user_id: userId, name, picture: image, email: userEmail } = req.body.decodedToken;

    //

    if (!contractInfo) return { message: 'contractInfo is required' };

    const emailAlreadyUsed = await PendingAccount.findOne({ userEmail });
    if (emailAlreadyUsed) {
        return { message: "Request already pending with this email" };
    }


    const username = await generateUniqUsername(userEmail);
    const account = new PendingAccount({ id: userId, name, username, email: userEmail, image, account_type: accountType, contractInfo, googleSignIn: true });
    const firebaseAuthCreate = await admin.auth().updateUser(userId, { email: userEmail, displayName: name, emailVerified: true });
    const createdAccount = await account.save();

    return { message: "Request sent successfully", createdAccount, firebaseAuthCreate };
};