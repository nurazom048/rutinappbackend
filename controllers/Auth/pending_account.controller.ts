
import { Request, Response } from 'express';

import admin from 'firebase-admin';
import { joinHisOwnNoticeboard } from '../Auth/auth.methods';
// models
const PendingAccount = require('../../models/Account_model/pending_account.model');
const Account = require('../../models/Account_model/Account.Model');

// ***************** allPendingAccount *******************************/
export const allPendingAccount = async (req: Request, res: Response) => {
    try {
        const accounts = await PendingAccount.find({ isAccept: false }).sort({ sendTime: 1 });
        res.status(200).json({ message: "All pending accounts", pendingAccounts: accounts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving pending accounts" });
    }
};

//************** acceptPending ********************* */
export const acceptPending = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const pendingAccount = await PendingAccount.findById(id);
        console.log(pendingAccount);
        if (!pendingAccount) {
            return res.status(404).json({ message: "Pending account not found" });
        }
        if (pendingAccount.isAccept) {
            return res.status(200).json({ message: "Request already accepted" });
        }

        const name = pendingAccount.name;
        const username = pendingAccount.username;
        const password = pendingAccount.password;
        const phone = pendingAccount.phone;
        const email = pendingAccount.email;
        const EIIN = pendingAccount.EIIN;
        const googleSignIn = pendingAccount.googleSignIn;


        try {
            // Check if email is taken or not
            if (email) {
                return res.status(404).json({ message: "Pending account not found" });
            }
            const firebase = await admin.auth().getUserByEmail(email!);
            if (!firebase) return res.status(401).json({ message: "User not found" });
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                return res.status(500).json({ message: "Error checking email availability" });
            }
        }

        // Check if email is already taken
        const emailAlreadyUsed = await Account.findOne({ email });
        if (emailAlreadyUsed) {
            return res.status(400).json({ message: "Email already taken" });
        }

        // Check if username is already taken
        const usernameAlreadyTaken = await Account.findOne({ username });
        if (usernameAlreadyTaken) {
            return res.status(400).json({ message: "Username already taken" });
        }

        // Check if phone number is already used
        if (phone) {
            const phoneNumberExists = await Account.findOne({ phone });
            if (phoneNumberExists) {
                return res.status(400).json({ message: "Phone number already exists" });
            }
        }

        // Create user
        const createNewAccount = new Account({ id, name, username, password, phone, email, EIIN, googleSignIn });
        createNewAccount.save();

        // Update the pending account
        pendingAccount.isAccept = true;
        await pendingAccount.save();

        const error = await joinHisOwnNoticeboard(id, id);
        if (error) {
            console.log(error);
            res.status(200).json({ message: "Account created successfully", createNewAccount });
        }

        res.status(200).json({ message: "Account created successfully", createNewAccount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error accepting pending request" });
    }
};