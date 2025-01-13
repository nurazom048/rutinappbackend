import { Request, Response, NextFunction } from 'express';
import prisma from '../../../prisma/schema/prisma.clint';







//********************* validateAccountCreation  ********************************************************* */

export const validateAccountCreation = async (req: Request, res: Response, next: NextFunction) => {
    const { name, username, password, phone, email, accountType } = req.body;

    if (!email && !phone) {
        return res.status(400).json({ message: "Must provide email or phone number" });
    }
    if (!name || !username || !password || !accountType) {
        return res.status(400).json({ message: "Please fill all required fields" });
    }

    try {
        // Check if email is already taken
        if (email) {
            const emailAlreadyTaken = await prisma.accountData.findUnique({
                where: { email },
            });

            if (emailAlreadyTaken) {
                return res.status(400).json({ message: "Email already taken" });
            }
        }

        // Check if username is already taken
        const usernameAlreadyTaken = await prisma.account.findUnique({
            where: { username },
        });

        if (usernameAlreadyTaken) {
            return res.status(400).json({ message: "Username already taken" });
        }

        // Check if phone number is already used
        if (phone) {
            const phoneNumberExists = await prisma.accountData.findUnique({
                where: { phone },
            });

            if (phoneNumberExists) {
                return res.status(400).json({ message: "Phone number already exists" });
            }
        }

        next();  // Proceed to the next middleware if validation passes
    } catch (error) {
        console.error("Error validating account creation:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
