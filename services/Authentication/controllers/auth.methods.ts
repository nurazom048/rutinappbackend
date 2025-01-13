
import jwt, { Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();


// imports models
import PendingAccount from '../../../Features/Account/models/pending_account.model';
import prisma from '../../../prisma/schema/prisma.clint';




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
    const isUsed = await prisma.account.findFirst({ where: { username } }) || await PendingAccount.findOne({ username });

    if (isUsed) {
        return username + Date.now();
    }
    return username;
};


/// join the academy user when he create academy account 
export const joinHisOwnNoticeboard = async (id: string): Promise<any> => {
    try {
        // Step 1: Check if the account exists
        const account = await prisma.account.findUnique({ where: { id } });
        if (!account) return { message: 'Academy not found', id };


        // Step 2: Check if the user is already a member
        const existingMember = await prisma.noticeBoardMember.findFirst({
            where: {
                accountId: id,
                memberId: id,
            },
        });

        if (existingMember) return { message: 'You are already a member' };

        // Step 3: Add user as a new member to their own noticeboard
        const newMember = await prisma.noticeBoardMember.create({
            data: {
                accountId: id,
                memberId: id,
            },
        });

        console.log('Added to noticeboard account: ', newMember);
        return { message: 'Successfully joined your own noticeboard', newMember };
    } catch (error: any) {
        console.error(error);
        return { message: error.message };
    }
};
