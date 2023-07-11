const Account = require('../../models/Account');
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
const { generateJWT, generateUsername } = require("./auth.methods");



//******************************************************* */
//
//...........Continue With google ........................//
//
//******************************************************* *//



exports.continueWithGoogle = async (req, res) => {
    const { googleAuthToken } = req.body;

    try {
        // Step 1: Verify the Google Auth Token
        // const token = googleAuthToken;
        console.log(googleAuthToken);

        let decodedToken;
        try {
            decodedToken = jwt.decode(googleAuthToken);
        } catch (error) {
            return res.status(500).json({ message: error });
        }

        const userId = decodedToken.user_id;
        const name = decodedToken.name;
        const image = decodedToken.picture;
        const userEmail = decodedToken.email;
        const displayName = decodedToken.displayName;

        // Step 2: Check if the user already has an account
        const existUser = await Account.findOne({ email: userEmail });
        if (existUser) {
            const ifGoogleSignEnable = existUser.googleSignIn;
            if (ifGoogleSignEnable) {
                const token = generateJWT(existUser);
                return res.status(200).json({ message: "Login successful", token, account: existUser });
            }
        }


        // If User is not created then create first then return token
        const username = generateUsername(userEmail);
        if (await Account.findOne({ username })) {
            return res.status(401).json({ message: "Username already exists" });
        }



        if (!userId || !name || !username || !image) {
            return res.status(400).json({ message: "Please fill the form" });
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
