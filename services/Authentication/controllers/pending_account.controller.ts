
import { Request, Response } from 'express';
import admin from 'firebase-admin';
// models
// methods
import { ObjectId } from 'mongodb'
import PendingAccount from '../../../Features/Account/models/pending_account.model';
import { joinHisOwnNoticeboard } from './auth.methods';
import { Prisma } from '@prisma/client';
import prisma from '../../../prisma/schema/prisma.clint';


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
        // Retrieve the pending account by ID
        const pendingAccount = await PendingAccount.findById(id);
        if (!pendingAccount)
            return res.status(404).json({ message: "Pending account not found" });
        if (pendingAccount.isAccept)
            return res.status(200).json({ message: "Request already accepted" });


        // Destructure and validate properties
        const {
            name,
            id: pendingAccountId,
            username,
            phone,
            email,
            googleSignIn,
            account_type,
            image,
        } = pendingAccount;

        if (!name || !email || !username || !phone) {
            return res.status(400).json({ message: "Required fields missing in pending account" });
        }

        // Check if email is already associated with a Firebase user
        try {
            await admin.auth().getUserByEmail(email);
            return res.status(400).json({ message: "User with this email already exists in Firebase" });
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                return res.status(500).json({ message: "Error verifying email in Firebase" });
            }
        }

        // Check for existing accounts in the database
        const [emailAlreadyUsed, usernameAlreadyTaken, phoneAlreadyUsed] = await Promise.all([
            prisma.accountData.findFirst({ where: { email } }),
            prisma.account.findFirst({ where: { username } }),
            prisma.accountData.findFirst({ where: { phone } }),
        ]);

        if (emailAlreadyUsed) return res.status(400).json({ message: "Email already taken" });
        if (usernameAlreadyTaken) return res.status(400).json({ message: "Username already taken" });
        if (phoneAlreadyUsed) return res.status(400).json({ message: "Phone number already exists" });

        // Register a new account in the database
        const newAccount = await prisma.account.create({
            data: {
                name,
                image: image ?? "",
                username,
                isVerified: true,
                accountData: {
                    create: { email, googleSignIn: googleSignIn ?? false, phone },
                },
            },
        });

        // Delete existing Firebase user if found (by UID) and create a new user
        try {
            await admin.auth().deleteUser(id.toString());
        } catch (error: any) {
            console.log("No existing Firebase user to delete.");
        }

        await admin.auth().createUser({
            uid: newAccount.id,
            displayName: name,
            photoURL: image ?? "",
            email,
            emailVerified: true,
        });

        console.log('Account created successfully:', newAccount);

        // Update the pending account status
        pendingAccount.isAccept = true;
        await pendingAccount.save();

        // Join user's own noticeboard
        const result = await joinHisOwnNoticeboard(pendingAccountId);
        if (result) {
            return res.status(500).json(result);
        }

        return res.status(200).json({ message: "Account created successfully", newAccount });

    } catch (error) {
        console.error("Error accepting pending request:", (error as any).message);
        res.status(500).json({ message: "Error accepting pending request" });
    }
};
