import { Request, Response, NextFunction } from 'express';
import Account from '../models/Account.Model';








//********************* validateAccountCreation  ********************************************************* */
export const validateAccountCreation = async (req: Request, res: Response, next: NextFunction) => {
    const { name, username, password, phone, email, account_type, EIIN, contractInfo } = req.body;

    // Validation
    if (!email) {
        return res.status(400).json({ message: "Must have email or phone number" });
    }
    if (!name || !username || !password) {
        return res.status(400).json({ message: "Please fill the form" });
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

    // If all validations pass, move to the next middleware or route handler
    next();
};

export default validateAccountCreation;
