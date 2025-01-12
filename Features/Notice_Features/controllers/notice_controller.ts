
// imports
import { sendNotificationMethods } from '../../../services/Notification services/oneSignalNotification.controller';
import express, { Request, Response } from 'express';


//! firebase imports
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_stroage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_stroage.firebaseConfig);// Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();


import { uploadFileToFirebaseAndGetDownloadUrl } from "../firebase/norice_board.firebase";
import { v4 as uuidv4 } from 'uuid';
import { model } from 'mongoose';
import { printD } from '../../../utils/utils';
import prisma from '../../../prisma/schema/prisma.clint';

/// make a add to 
//?_______________________________________________________________________________________!//

///......... write code to add notice to notice bode // Function to add a new notice and notify relevant members
export const addNotice = async (req: any, res: Response) => {
    // Destructure necessary fields from the request body and user info
    const { title, description, mimetypeChecked } = req.body;
    const { id, error } = req.user;  // User ID and error info
    const uuid = uuidv4();  // Generate a unique identifier for the notice

    try {
        // Step 1: Validate inputs
        if (error) return res.status(400).json({ message: 'PDF file is required' });
        if (!req.file) return res.status(400).json({ message: 'PDF file is required' });
        if (!title) return res.status(400).json({ message: 'title is required' });

        // Step 2: Check file size (Limit: 10 MB)
        const fileSize = req.file.size;
        if (fileSize > 11 * 1024 * 1024) {
            return res.status(400).json({ message: 'File size exceeds the allowed limit (10 MB)' });
        }

        // Step 3: Check file type (Ensure it's a PDF)
        if (!mimetypeChecked) {
            const fileType = req.file.mimetype;
            if (fileType !== 'application/pdf') {
                return res.status(400).json({ message: 'Only PDF files are allowed' });
            }
        }

        // Step 4: Find Account and check if the account exists
        const findAccount = await prisma.account.findUnique({ where: { id: id } });
        if (!findAccount) return res.status(404).json({ message: 'Account not found' });

        const accountID = findAccount.id;
        console.log(accountID); // Log account ID for debugging

        // Step 5: Upload PDF to Firebase Storage and get the download URL
        const pdfUrl = await uploadFileToFirebaseAndGetDownloadUrl(uuid, accountID, req.file);

        // Step 6: Create Notice in the Prisma database
        const createdNotice = await prisma.notice.create({
            data: {
                title,
                description, // Add description if provided
                publisherId: id, // Account ID of the user publishing the notice
                pdf: pdfUrl, // URL of the uploaded PDF
            },
        });

        // Step 7: Get notification members who have notifications enabled
        const notificationMembers = await prisma.noticeBoardMember.findMany({
            where: {
                accountId: id, // Filter by the accountId (or other criteria, like academyId)
                notificationOn: true, // Only members who have notifications enabled
            },
            include: {
                account: {
                    select: {
                        accountData: {
                            select: {
                                oneSignalUserId: true, // Fetch OneSignal User ID for push notifications
                            },
                        },
                    },
                },
            },
        });

        // Step 8: Map to get all OneSignal User IDs from the notification members
        const oneSignalUserIds = notificationMembers
            .map((member) => member.account.accountData?.oneSignalUserId)
            .filter((userId) => userId !== null && userId !== undefined) as string[];

        console.log("OneSignal User IDs:", oneSignalUserIds); // Log OneSignal User IDs for debugging

        // Step 9: Send push notification to the OneSignal User IDs
        const response = await sendNotificationMethods(oneSignalUserIds, `A New Notice from ${findAccount.name}`, "New Notice");

        // Step 10: Return a success response with the created notice data
        res.status(200).json({ message: 'Notice created and added successfully', notice: createdNotice });

    } catch (error: any) {
        // Handle errors and send a response with error message
        console.error("Error occurred:", error);
        res.status(500).json({ message: error.message });
    }
};



// //************  Delete Notice ***************************/
export const deleteNotice = async (req: any, res: Response) => {
    const { noticeId } = req.params;
    const { id } = req.user;


    try {
        // Step 1: Find Account and check permission
        const findAccount = await prisma.account.findUnique({ where: { id: id } });
        if (!findAccount) return res.status(404).json({ message: 'Account not found' });

        // Step 2: Find the notice
        const notice = await prisma.notice.findUnique({ where: { id: noticeId } });
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        // Step 3: Check if the notice belongs to the user
        if (notice.publisherId !== id) {
            return res.status(403).json({ message: 'You do not have permission to delete this notice' });
        }


        // Step 4: Delete notice from the database
        await prisma.notice.delete({ where: { id: noticeId } });

        // Step 5: Delete notice file from Firebase Storage (if file URL exists)
        if (notice.pdf) {
            const storage = getStorage();
            const pdfRef = ref(storage, notice.pdf);

            try {
                await deleteObject(pdfRef);
            } catch (storageError) {
                console.error('Error deleting notice file from Firebase Storage:', storageError);
                // Handle storage error if needed
            }
        }


        // Return success response
        res.status(200).json({ message: 'Notice deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting notice:', error);

        res.status(500).json({ message: 'Error deleting notice', error: error.message });
    }
};



//************  join noticeboard ***************************/

export const joinNoticeboard = async (req: any, res: Response) => {
    const { academyID } = req.params;
    const { id } = req.user;

    try {
        if (!academyID) return res.status(400).json({ message: 'AcademyID is required' });


        // Step 1: Check if the academy account exists
        const academyAccount = await prisma.account.findUnique({ where: { id: academyID } });
        if (!academyAccount) return res.status(404).json({ message: 'AcademyAccount not found' });


        // Step 2: Check if the user is already a member of the academy
        const existingMember = await prisma.noticeBoardMember.findFirst({
            where: {
                accountId: academyID,
                memberId: id
            }
        });
        if (existingMember) return res.status(409).json({ message: 'You are already a member' });

        // Step 3: Join as a member
        const newMember = await prisma.noticeBoardMember.create({
            data: {
                accountId: academyID,
                memberId: id,
            },
        });
        // Step 4: Respond with success message
        res.status(200).json({ message: 'You are now a member of this noticeboard' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
//************  leaveMember ***************************/
export const leaveMember = async (req: any, res: Response) => {
    const { academyID } = req.params;
    const { id } = req.user;
    try {
        if (!academyID) return res.status(400).json({ message: 'AcademyID is required' });

        // Step 1: Check if the academy account exists
        const findAcademy = await prisma.account.findUnique({
            where: { id: academyID },
        });
        if (!findAcademy) return res.status(404).json({ message: 'Account not found' });

        // Step 2: Check if the user is a member of the academy
        const alreadyMember = await prisma.noticeBoardMember.findFirst({
            where: {
                accountId: academyID,
                memberId: id,
            }
        });
        if (!alreadyMember) {
            return res.status(404).json({ message: 'You are not a member of this academy' });
        }

        // Step 3: Delete the member from the notice board
        await prisma.noticeBoardMember.delete({
            where: {
                id: alreadyMember.id,  // Deleting the member based on their unique ID
            }
        });

        res.status(200).json({ message: 'Successfully left the noticeboard' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};




// recentNotice
export const recentNotice = async (req: any, res: Response) => {
    const { id } = req.user;
    const { page = 1, limit = 10 } = req.query;

    try {
        // Step 1: Get all joined NoticeBoardMember records for the user
        const allJoinedNoticeBoard = await prisma.noticeBoardMember.findMany({
            where: { memberId: id },
            select: { accountId: true }, // Only select the academyId from the NoticeBoardMember
        });

        // Extract academy IDs
        const academyIDs = allJoinedNoticeBoard.map((item) => item.accountId);

        // Step 2: Count notices that belong to the academy IDs
        const count = await prisma.notice.count({
            where: { publisherId: { in: academyIDs } },
        });
        const totalPages = Math.ceil(count / parseInt(limit.toString()));

        // Step 3: Fetch notices for the academies the user is part of, with pagination
        const notices = await prisma.notice.findMany({
            where: { publisherId: { in: academyIDs } },
            select: {
                id: true,
                title: true,
                pdf: true,
                description: true,
                publisherId: true,
                createdAt: true,
                updatedAt: true,
                Account: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
            },
            skip: (page - 1) * parseInt(limit.toString()),
            take: parseInt(limit.toString()),
            orderBy: { createdAt: 'desc' },
        });

        // Step 4: Map the notices to remove any null properties, especially image
        const finalNotices = notices.map((notice) => {
            // Use optional chaining and conditional replacement instead of delete
            const cleanedNotice = {
                ...notice,
                Account: {
                    ...notice.Account,
                    image: notice.Account.image ?? undefined, // Replace null image with undefined
                    name: notice.Account.name ?? undefined,
                    username: notice.Account.username ?? undefined,
                },
                description: notice.description ?? undefined,
                pdf: notice.pdf ?? undefined,
            };

            return cleanedNotice;
        }).filter((notice) => notice.publisherId !== null);

        // Step 5: Respond with the notices and pagination info
        res.status(200).json({
            message: 'Success - All recent notices',
            notices: finalNotices,
            currentPage: parseInt(page.toString()),
            totalPages,
            totalCount: count,
        });
    } catch (error) {
        console.error('Error fetching recent notices:', error);
        res.status(500).json({ message: error });
    }
};

// view all notices by notice id
export const recentNoticeByAcademeID = async (req: any, res: Response) => {
    const { academyID } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        // Step 1: Find the academy account
        const findAccount = await prisma.account.findUnique({ where: { id: academyID } });
        if (!findAccount) return res.status(404).json({ message: "Account not found" });


        // Step 2: Count the total number of notices for pagination
        const count = await prisma.notice.count({ where: { publisherId: academyID } });
        const totalPages = Math.ceil(count / limit);


        // Step 3: Get the notices with pagination and sorting
        const notices = await prisma.notice.findMany({
            where: { publisherId: academyID },
            select: {
                id: true,
                title: true,
                description: true,
                pdf: true,
                createdAt: true,
                updatedAt: true,
                publisherId: true,
                Account: { select: { name: true, username: true, image: true } },
            },
            skip: (parseInt(page) - 1) * parseInt(limit),  // Pagination calculation
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },  // Sorting by createdAt descending
        });


        // Step 4: Filter out any notices that have null publisherId
        const finalNotices = notices.filter((notice: any) => notice.Account !== null);

        res.status(200).json({
            message: "Success",
            notices: finalNotices,
            currentPage: parseInt(page),
            totalPages,
            totalCount: count,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
//************** current_user_status *********** */
export const current_user_status = async (req: any, res: Response) => {
    try {
        const { academyID } = req.params;
        const { id } = req.user;

        let isOwner = false;
        let activeStatus = "not_joined";
        let isSave = false;
        let notificationOn = false;

        // Step 1: Find the academy account
        const academyAccount = await prisma.account.findUnique({ where: { id: academyID } });
        if (!academyAccount) {
            return res.status(404).json({ message: "Academy account not found" });
        }

        // Step 2: Check if the user is a member
        const foundMember = await prisma.noticeBoardMember.findFirst({
            where: { accountId: academyID, memberId: id },
        });
        if (!foundMember) {
            return res.status(404).json({ message: "You are not a member of this Academy" });
        }

        // Step 3: Determine the user's active status
        if (foundMember) {
            activeStatus = "joined";

            // Check if the user is the owner
            if (foundMember.accountId.toString() === id) {
                isOwner = true;
            }

            // Check if notification is enabled
            if (foundMember.notificationOn === true) {
                notificationOn = true;
            }

            // If additional "isSave" logic is needed, you can add it here.
            // For now, it remains as false, but you can implement any specific check for "isSave" if required.
        }

        res.status(200).json({
            message: "Check noticeboard status",
            isOwner,
            activeStatus,
            isSave,
            notificationOn,
        });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};


//************* Notification on**************//

export const notification_On = async (req: any, res: Response) => {
    const { academyID } = req.params;
    const { id } = req.user;

    try {
        // Step 1: Find the academy account
        const academyAccount = await prisma.account.findUnique({ where: { id: academyID } });
        if (!academyAccount) return res.status(404).json({ message: "Academy account not found" });


        // Step 2: Check if the user is a member
        const foundMember = await prisma.noticeBoardMember.findFirst({ where: { accountId: academyID, memberId: id } });
        if (!foundMember) return res.status(404).json({ message: "You are not a member of this Academy" });


        // Step 3: Check if the user has already turned on notifications
        if (foundMember.notificationOn) return res.status(200).json({ message: "Notifications are already turned on", notificationOn: true });

        // Step 4: Update notificationOn field to true
        await prisma.noticeBoardMember.update({
            where: { id: foundMember.id },
            data: { notificationOn: true },
        });
        res.status(200).json({ message: "Notifications turned on", notificationOn: true });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};



//************* Notification off **************//

export const notification_Off = async (req: any, res: Response) => {
    const { academyID } = req.params;
    const { id } = req.user;

    try {
        // Step 1: Find the academy account
        const academyAccount = await prisma.account.findUnique({ where: { id: academyID } });
        if (!academyAccount) return res.status(404).json({ message: "Academy account not found" });

        // Step 2: Check if the user is a member
        const foundMember = await prisma.noticeBoardMember.findFirst({ where: { accountId: academyID, memberId: id } });
        if (!foundMember) return res.status(404).json({ message: "You are not a member of this Academy" });

        // Step 3: Check if the user has already turned off notifications
        if (!foundMember.notificationOn) {
            return res.status(200).json({ message: "Notifications are already turned off", notificationOn: false });
        }

        // Step 4: Update notificationOn field to false
        await prisma.noticeBoardMember.update({
            where: { id: foundMember.id },
            data: { notificationOn: false },
        });

        res.status(200).json({ message: "Notifications turned off", notificationOn: false });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
