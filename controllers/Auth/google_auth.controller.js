const Account = require('../../models/Account');
const PendingAccount = require('../../models/Account_model/pendigAccount.model')
const jwt = require('jsonwebtoken');


// Firebase admin sdk from  Firebase config
const admin = require('firebase-admin');

// Firebase auth from  Firebase config
const firebaseApp = require('../../config/firebase.config');
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const auth = getAuth(firebaseApp);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file
const bcrypt = require('bcrypt');
require('dotenv').config();
//method's
const { generateJWT, generateUniqUsername } = require("./auth.methods");



//******************************************************* */
//
//...........Continue With google ........................//
//
//******************************************************* *//



exports.continueWithGoogle = async (req, res) => {
    const { googleAuthToken, account_type } = req.body;


    try {
        // Step 1: Verify the Google Auth Token
        // const token = googleAuthToken;

        let decodedToken;
        try {
            decodedToken = jwt.decode(googleAuthToken);

        } catch (error) {
            return res.status(500).json({ message: error });
        }
        //console.log(decodedToken)
        const userId = decodedToken.user_id;
        const name = decodedToken.name;
        const image = decodedToken.picture;
        const userEmail = decodedToken.email;
        const displayName = decodedToken.displayName;

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
                const token = generateJWT(existUser);
                return res.status(200).json({ message: "Login successful", token, account: existUser });
            }
        }

        // If User is not created then create first then return token
        const username = await generateUniqUsername(userEmail);
        if (await Account.findOne({ username })) {
            return res.status(401).json({ message: "Username already exists" });
        }

        //............................................................................................//
        //............................... Sign Up............. .......................................//
        //............................................................................................//



        if (!userId || !name || !username || !image) {
            return res.status(400).json({ message: "Please fill the form" });
        }
        // step: Chak if ths is academy or not
        if (account_type == 'academy') {
            // Call the createPendingRequest function
            const response = await createPendingRequest(req, res, decodedToken);
            return res.status(201).json(response);
        }


        // Step 3: Create user in MongoDB
        const account = new Account({ id: userId, name, image, username, email: userEmail, googleSignIn: true });

        // Step 4: Update user in Firebase
        await admin.auth().updateUser(userId, {
            email: userEmail,
            displayName: displayName,
            emailVerified: true,
        });
        await account.save();

        const JwtToken = generateJWT({ account });

        res.status(200).json({ message: "Login successful", token: JwtToken, account: account });
    } catch (error) {
        console.error("Error processing Google Auth Token:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
//............................................................................................//
//............................... createPendingRequest........................................//
//............................................................................................//

const createPendingRequest = async (req, res, decodedToken) => {
    const { account_type, EIIN, contractInfo } = req.body;

    //throw { message: "Request already pending with this email", decodedToken };
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

