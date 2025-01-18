
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

//************** acceptPending *********************//
export const acceptPending = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // Step 1: Retrieve the pending account by ID
        // This step ensures we are processing the correct account and allows us to access its details.
        const pendingAccount = await PendingAccount.findById(id);
        if (!pendingAccount) {
            return res.status(404).json({ message: "Pending account not found" });
        }
        if (pendingAccount.isAccept) {
            return res.status(200).json({ message: "Request already accepted" });
        }

        const { id: pendingAccountId, name, username, phone, email, googleSignIn, account_type, image, password } = pendingAccount;

        // Step 2: Validate required fields
        // Ensures that all mandatory fields are provided before proceeding.
        if (!name || !email || !username) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        // Step 3: Check if email is already associated with a Firebase user
        // Avoids duplicate accounts in Firebase by verifying the email.
        try {
            const firebaseUser = await admin.auth().getUserByEmail(email);
            if (firebaseUser.uid !== pendingAccountId) {
                return res.status(400).json({ message: "User with this email already exists in Firebase" });
            }
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                return res.status(500).json({ message: "Error verifying email in Firebase" });
            }
        }

        // Step 4: Check for existing accounts in the database
        // Prevents duplicate accounts by ensuring the email, username, or phone is not already taken.
        const [emailAlreadyUsed, usernameAlreadyTaken, phoneAlreadyUsed] = await Promise.all([
            prisma.accountData.findFirst({ where: { email } }),
            prisma.account.findFirst({ where: { username } }),
            prisma.accountData.findFirst({ where: { phone } }),
        ]);

        if (emailAlreadyUsed) return res.status(400).json({ message: "Email already taken" });
        if (usernameAlreadyTaken) return res.status(400).json({ message: "Username already taken" });
        // if (phoneAlreadyUsed) return res.status(400).json({ message: "Phone number already exists" });

        // Step 5: Create a new account in the database
        // Registers the user with the provided details and links to account data.
        const newAccount = await prisma.account.create({
            data: {
                id: pendingAccountId,
                name,
                username,
                isVerified: true,
                accountType: account_type,
                accountData: {
                    create: { email, googleSignIn: googleSignIn ?? false, phone, password },
                },
            },
        });

        // Step 6: Update or create a Firebase user
        // Ensures the user is properly set up in Firebase with the correct details.
        await admin.auth().updateUser(newAccount.id, {
            displayName: name,
            photoURL: image,
            email,
            emailVerified: true,
        });

        // Step 7: Update the pending account status
        // Marks the pending account as accepted to avoid duplicate processing.
        pendingAccount.isAccept = true;
        await pendingAccount.save();

        // Step 8: Join user's own noticeboard
        // Links the user to their personalized noticeboard as part of the setup.
        const result = await joinHisOwnNoticeboard(pendingAccountId);
        if (result) {
            return res.status(500).json(result);
        }

        return res.status(200).json({ message: "Account created successfully", newAccount });
    } catch (error: any) {
        console.error("Error accepting pending request:", error.message);
        res.status(500).json({ message: "Error accepting pending request" });
    }
};
