
import { Request, Response } from 'express';
import admin from 'firebase-admin';
// models
import Account from '../../../Fetures/Account/models/Account.Model';
// methods
import { ObjectId } from 'mongodb'
import PendingAccount from '../../../Fetures/Account/models/pending_account.model';
import { joinHisOwnNoticeboard } from './auth.methods';


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
        console.log('PendingAccount', pendingAccount);
        if (!pendingAccount) {
            return res.status(404).json({ message: "Pending account not found" });
        }
        if (pendingAccount.isAccept) {
            return res.status(200).json({ message: "Request already accepted" });
        }

        const name = pendingAccount.name;
        const pendingAccountId = pendingAccount.id;
        const username = pendingAccount.username;
        const password = pendingAccount.password;
        const phone = pendingAccount.phone;
        const email = pendingAccount.email;
        const EIIN = pendingAccount.EIIN;
        const googleSignIn = pendingAccount.googleSignIn;
        const account_type = pendingAccount.account_type;



        try {
            // Check if email is taken or not
            if (!email) {
                return res.status(404).json({ message: "Email not found" });
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
        const objectId = new ObjectId(pendingAccountId)
        const createNewAccount = new Account({
            id: objectId,
            name,
            username,
            password,
            email,
            EIIN,
            account_type,
            googleSignIn,
        });
        // Check if the phone field is set and not undefined
        if (phone !== undefined) {
            createNewAccount.phone = phone;
        }

        const ceated = await createNewAccount.save();
        console.log('created account  : ' + ceated)



        // Update the pending account
        pendingAccount.isAccept = true;
        await pendingAccount.save();

        //
        // Join His owen noticeboard
        const result = await joinHisOwnNoticeboard(objectId);
        if (result) {
            return res.status(500).json(result);
        } else {
            res.status(200).json({ message: "Account created successfully", createNewAccount });
        }


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error accepting pending request" });
    }
};
