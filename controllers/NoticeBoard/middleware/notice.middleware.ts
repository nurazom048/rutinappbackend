import { Request, Response, NextFunction } from 'express';
import Account, { AccountType } from '../../../models/Account_model/Account.Model';




//
//*****************************************************************************/
//
//_____________________ Check if the Account type is Academy Or not__________//
//
//*****************************************************************************/

export const checkAccountType = async (req: any, res: Response, next: NextFunction) => {
    const { id } = req.user;

    try {
        if (!id) {
            return res.status(401).json({ message: 'Authentication failed. Please log in again.' });
        }

        // Step 1: Find account and check account type
        const account = await Account.findById(id);

        if (account?.account_type !== AccountType.Academy) {
            return res.status(401).json({ message: 'Only Academy Can Upload Notice' });
        }

        next(); // Call next middleware if the account type is correct
    } catch (error) {
        // Handle errors gracefully
        console.error('Error while checking account type:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
