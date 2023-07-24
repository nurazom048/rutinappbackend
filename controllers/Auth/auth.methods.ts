
import jwt, { Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

import Account from '../../models/Account_model/Account.Model';
import PendingAccount from '../../models/Account_model/pending_account.model';
import NoticeBoardMember from "../../models/notice models/noticeboard_member";
//




export const generateUsername = (email: string): string => {
    const atIndex = email.indexOf("@");
    if (atIndex !== -1) {
        return email.substring(0, atIndex);
    }
    return email;
};
// Generate uniq username 

export const generateUniqUsername = async (email: string): Promise<string> => {
    const username = generateUsername(email);
    const isUsed = await Account.findOne({ username }) || await PendingAccount.findOne({ username });

    if (isUsed) {
        return username + Date.now();
    }
    return username;
};
//Methods: Generate Token


/// join the academy user when he create academy account 

export const joinHisOwnNoticeboard = async (academyID: string, id: string): Promise<any> => {
    try {
        const account = await Account.findById(academyID);
        if (!account) {
            return { message: 'Academy not found' };
        }

        const existingMember = await NoticeBoardMember.findOne({
            academyID,
            memberID: id,
        });

        if (existingMember) {
            return { message: 'You are already a member' };
        }

        const newMember = new NoticeBoardMember({
            academyID,
            memberID: id,
        });

        await newMember.save();
    } catch (error: any) {
        console.error(error);
        return { message: error.message };
    }
};
