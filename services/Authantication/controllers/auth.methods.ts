
import jwt, { Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();


// imports models
import Account from '../../../Fetures/Account/models/Account.Model';
import PendingAccount from '../../../Fetures/Account/models/pending_account.model';
import NoticeBoardMember from "../../../Fetures/Notice_Fetures/models/noticeboard_member";




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

export const joinHisOwnNoticeboard = async (id: any): Promise<any> => {
    try {
        const account = await Account.findOne({ id: id });
        if (!account) {
            return { message: 'Academy not found ', id: id };
        }

        const existingMember = await NoticeBoardMember.findOne({
            academyID: id,
            memberID: id,
        });

        if (existingMember) {
            return { message: 'You are already a member' };
        }

        const newMember = new NoticeBoardMember({
            academyID: id,
            memberID: id,
        });

        const added = await newMember.save();
        console.log('added to noticeboard account  : ' + added)

    } catch (error: any) {
        console.error(error);
        return { message: error.message };
    }
};
