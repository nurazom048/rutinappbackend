
// Firebase admin sdk from Firebase config
import admin from 'firebase-admin';
const serviceAccount = require('../../../config/firebase/admin.sdk');
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import prisma from '../../../prisma/schema/prisma.clint';
const firebaseApp = require('../../../config/firebase/firebase.config');
const auth = getAuth(firebaseApp);

//
import { Request, Response } from 'express';
import { generateUniqUsername, } from './auth.methods';
import { generateAuthToken, generateRefreshToken, } from '../helper/Jwt.helper';
import { generateAndSetTokens } from '../helper/Authentication';
import PendingAccount from '../../../Features/Account/models/pending_account.model';
import nodemailer from 'nodemailer';
import { AccountType } from '@prisma/client';




//****************************************************************************************************
// ------------------------------- Continue With Google -----------------------------------------------
//****************************************************************************************************/


// Handles Google sign-in flow for new or existing accounts
export const continueWithGoogle = async (req: Request, res: Response) => {
    const { accountType } = req.body;
    const { user_id: userId, name, picture: image, email: userEmail } = req.body.decodedToken;

    try {
        // Step 1: Check for pending account approval
        const pendingAccount = await PendingAccount.findOne({ email: userEmail });
        if (pendingAccount && !pendingAccount.isAccept) {
            return res.status(402).json({
                message: "Academy request is pending",
                account: { email: pendingAccount.email },
                pendingAccount
            });
        }

        // Step 2: Check if the user already exists in the system
        const accountData = await prisma.accountData.findUnique({ where: { email: userEmail } });
        const existingUser = accountData ? await prisma.account.findUnique({ where: { id: accountData.ownerAccountId } }) : null;

        // Step 3: Handle existing Google sign-in user
        if (existingUser && accountData?.googleSignIn) {
            const tokens = generateAndSetTokens(res, existingUser.id, existingUser.username);
            return res.status(200).json({ message: "Login successful", token: tokens.authToken, account: existingUser });
        }

        // Step 4: Generate a unique username for new user registration
        const username = await generateUniqUsername(userEmail);
        const userExists = await prisma.account.findUnique({ where: { username } });

        // Step 5: Check if the username or email already exists
        if (userExists || accountData) {
            return res.status(401).json({ message: "Account with this username or email already exists." });
        }

        // Step 6: Validate required input data
        if (!userId || !name || !username || !userEmail) {
            return res.status(400).json({ message: "Please fill the form" });
        }

        // Step 7: Handle account creation for academy type
        if (accountType === AccountType.academy) {
            const response = await createPendingRequest(req, res, req.body.decodedToken);
            return res.status(201).json(response);
        }

        // Step 8: Register a new account in the database
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

        // Step 9: Update Firebase authentication system
        await admin.auth().deleteUser(userId.toString());
        await admin.auth().createUser({
            uid: newAccount.id,
            displayName: name,
            photoURL: image,
            email: userEmail,
            emailVerified: true,
        });

        // Step 10: Generate and set tokens for the new user
        const tokens = generateAndSetTokens(res, newAccount.id, newAccount.username);

        // Step 11: Send welcome email to the user
        const transporter = nodemailer.createTransport({
            service: "Gmail", // Change service as needed
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS, // Your email password or app-specific password
            },
        });

        const mailOptions = {
            from: '"Your App Name" <your-email@example.com>',
            to: userEmail,
            subject: "Welcome to Your App!",
            text: `Hello ${name}, welcome to our app! Your username is ${username}.`,
            html: `<p>Hello <strong>${name}</strong>, welcome to our app!</p><p>Your username is <strong>${username}</strong>.</p>`
        };

        await transporter.sendMail(mailOptions);

        // Step 12: Send success response to client
        console.log({ message: "Login successful", token: tokens.authToken, account: newAccount });
        res.status(200).json({ message: "Login successful", token: tokens.authToken, account: newAccount });

    } catch (error) {
        // Error handling for any issues during the process
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