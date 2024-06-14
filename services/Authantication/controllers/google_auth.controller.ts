import { Request, Response } from 'express';
import Account from '../../../Fetures/Account/models/Account.Model';
import jwt from 'jsonwebtoken';
import mongoose, { ObjectId, isObjectIdOrHexString, isValidObjectId } from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { generateUniqUsername } from './auth.methods';
import { generateAuthToken, generateRefreshToken } from '../../../services/Authantication/helper/Jwt.helper';
import PendingAccount from '../../../Fetures/Account/models/pending_account.model';
import { printD, printError } from '../../../utils/utils';
dotenv.config();



interface DecodedToken {

    user_id: string;
    name: string;
    picture: string;
    iss: string;
    aud: string;
    auth_time: number;
    sub: string;
    iat: number;
    exp: number;
    email: string;
    email_verified: boolean;
    firebase: {
        identities: { [provider: string]: any[]; email: any[] };
        sign_in_provider: string;
    };
}


// Firebase admin sdk from Firebase config
import admin from 'firebase-admin';
const serviceAccount = require('../../../config/firebase/admin.sdk');

// Firebase auth from Firebase config
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
const firebaseApp = require('../../../config/firebase/firebase.config');
const auth = getAuth(firebaseApp);





//****************************************************************************************************/
// --------------------------------- Continue With Google --------------------------------------------/
//****************************************************************************************************/

export const continueWithGoogle = async (req: Request, res: Response) => {
    const { googleAuthToken, account_type } = req.body;



    try {
        // Step 1: Verify the Google Auth Token
        // const token = googleAuthToken;

        let decodedToken;
        try {
            decodedToken = jwt.decode(googleAuthToken) as DecodedToken;

        } catch (error) {
            return res.status(500).json({ message: error });
        }
        if (!decodedToken) {
            return res.status(500).json({ message: 'No Token Found' });
        }


        const userId = decodedToken.user_id;
        const name = decodedToken.name as any;
        const image = decodedToken.picture as any;
        const userEmail = decodedToken.email as any;
        const displayName = decodedToken.name as string;




        //............................................................................................//
        //............................... login............. .......................................//
        //............................................................................................//

        // If pending then go to pending page


        const pendingAccount = await PendingAccount.findOne({ email: userEmail });
        if (pendingAccount) {
            // Check if accept or not
            if (!pendingAccount.isAccept) {
                return res.status(402).json({ message: "Academy request is pending", account: { email: pendingAccount.email }, pendingAccount });
            }

        }

        // Step 2: Check if the user already has an account
        const existUser = await Account.findOne({ email: userEmail });
        // TODo for pending
        if (existUser) {
            const ifGoogleSignEnable = existUser.googleSignIn;
            if (ifGoogleSignEnable) {

                // Create a new auth token and refresh token
                const authToken = generateAuthToken(existUser._id, existUser.username);
                const refreshToken = generateRefreshToken(existUser._id, existUser.username);

                // Set the tokens in the any headers
                res.setHeader('Authorization', `Bearer ${authToken}`);
                res.setHeader('x-refresh-token', refreshToken);
                // send success response
                console.log({ message: "Login successful", token: authToken, account: existUser });
                return res.status(200).json({ message: "Login successful", token: authToken, account: existUser });
            }
        }

        // If User is not created then create first then return token
        const username = await generateUniqUsername(userEmail);
        if (await Account.findOne({ username })) {
            return res.status(401).json({ message: "Username already exists" });
        }

        if (await Account.findOne({ email: userEmail })) {
            return res.status(401).json({ message: "Email already exists" });
        }

        //............................................................................................//
        //............................... Sign Up............. .......................................//
        //............................................................................................//

        if (!userId || !name || !username || !userEmail) {
            return res.status(400).json({ message: "Please fill the form" });
        }
        // step: Chak if ths is academy or not
        if (account_type == 'academy') {
            // Call the createPendingRequest function
            const response = await createPendingRequest(req, res, decodedToken);
            return res.status(201).json(response);
        }

        // Step 3: Create user in MongoDB
        const account = new Account({ name, image, username, email: userEmail, googleSignIn: true });

        // Step 4: Update user in Firebase
        await admin.auth().deleteUser(userId.toString());
        admin.auth().createUser({
            uid: account.id || account._id,
            displayName: name,
            photoURL: image,
            email: userEmail,
            emailVerified: true,


        })

        await account.save();

        // Create a new auth token and refresh token
        const authToken = generateAuthToken(account._id, account.username);
        const refreshToken = generateRefreshToken(account._id, account.username);

        // Set the tokens in the response headers
        res.setHeader('Authorization', `Bearer ${authToken}`);
        res.setHeader('x-refresh-token', refreshToken);

        console.log({ message: "Login successful", token: authToken, account: account });
        res.status(200).json({ message: "Login successful", token: authToken, account: account });
    } catch (error) {
        console.error("Error processing Google Auth Token:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
//............................................................................................//
//............................... createPendingRequest........................................//
//............................................................................................//

const createPendingRequest = async (req: Request, res: Response, decodedToken: any) => {
    const { account_type, EIIN, contractInfo } = req.body;
    const userId = decodedToken.user_id;
    const name = decodedToken.name;
    const image = decodedToken.picture;
    const email = decodedToken.email;
    //

    if (!EIIN) return { message: 'EIIN Number is required' };
    if (!contractInfo) return { message: 'contractInfo is required' };

    const emailAlreadyUsed = await PendingAccount.findOne({ email });
    if (emailAlreadyUsed) {
        return { message: "Request already pending with this email" };
    }

    const EIINAlreadyUsed = await PendingAccount.findOne({ EIIN });
    if (EIINAlreadyUsed) {
        return { message: "Request already pending with this EIIN" };
    }
    const username = await generateUniqUsername(email);
    const account = new PendingAccount({ id: userId, name, username, email, image, account_type, contractInfo, EIIN, googleSignIn: true });
    const firebaseAuthCreate = await admin.auth().updateUser(userId, { email: email, displayName: name, emailVerified: true });
    const createdAccount = await account.save();

    return { message: "Request sent successfully", createdAccount, firebaseAuthCreate };
};