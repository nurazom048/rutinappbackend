
//! iports
const NoticeBoard = require('../../models/notice models/notice_bord');
const NoticeBoardMember = require('../../models/notice models/noticeboard_member');
const Notice = require('../../models/notice models/notice');
const Notification = require('../../models/Notification Models/notification.model');
const { sendNotificationMethode } = require('../../controllers/notification/oneSignalNotification.controller');
import express, { Request, Response } from 'express';




const Account = require('../../models/Account_model/Account.Model');
const mongoose = require('mongoose');

//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_stroage = require("../../config/firebase/firebase_storage");
initializeApp(firebase_stroage.firebaseConfig);// Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();


import { getNoticePDFUrls, getNoticePDFs } from "./firebase/norice_board.firebase";
const { v4: uuidv4 } = require('uuid');


/// make a add to 
//?_______________________________________________________________________________________!//

///......... write code to add notice to notice bode 
export const addNotice = async (req: any, res: Response) => {
    const { content_name, description, mimetypeChecked } = req.body;
    const { id, error } = req.user;
    console.log("req.use")
    console.log(req.user)

    // console.log(req.body);
    // console.log(req.file);

    try {
        if (error) return res.status(400).json({ message: 'PDF file is required' });
        if (!req.file) return res.status(400).json({ message: 'PDF file is required' });

        // Check file size
        const fileSize = req.file.size;
        if (fileSize > 11 * 1024 * 1024) {
            return res.status(400).json({ message: 'File size exceeds the allowed limit (10 MB)' });
        }

        // Check file type
        if (!mimetypeChecked) {
            const fileType = req.file.mimetype;
            if (fileType !== 'application/pdf') {
                //console.log({ message: 'Only PDF files are allowed' })
                throw res.status(400).json({ message: 'Only PDF files are allowed from code' });
            }
        }
        // Step 1: Find Account and check permission
        const findAccount = await Account.findById(id);
        if (!findAccount) return res.status(404).json({ message: 'Account not found' });
        const accountID = findAccount.id;

        // Step 2: Upload to Firebase Storage
        const uuid = uuidv4();
        const filename = `${accountID}-${uuid}-${req.file.originalname}`;
        const metadata = { contentType: req.file.mimetype };
        const storage = getStorage(); // Get a reference to the Firebase Storage bucket
        const pdfRef = ref(storage, `notice/academyId-${accountID}/pdf/${filename}`); // Create a reference to the bucket
        await uploadBytes(pdfRef, req.file.buffer, metadata);
        const pdfUrl = await getDownloadURL(pdfRef);

        // Step 3: Save to MongoDB with PDF URL
        const notice = new Notice({
            _id: uuid,
            content_name,
            pdf: pdfUrl,
            description,
            academyID: findAccount.id,
        });
        const savedNotice = await notice.save();


        const NotificationMember = await NoticeBoardMember.find({ academyID: id, notificationOn: true })
            .populate('memberID', 'osUserID')
            .exec();

        console.log(NotificationMember);

        const oneSignalUserId = NotificationMember
            .map((member: any) => member.memberID.osUserID)
            .filter((osUserId: string) => osUserId !== '' && osUserId !== undefined);

        console.log(oneSignalUserId);

        // Step 4: Create a notification with Firebase
        const response = await sendNotificationMethode(oneSignalUserId, `A New Notice from ${findAccount.name}`, "New Notice");

        res.status(200).json({ message: 'Notice created and added successfully', notice: savedNotice });
        console.log(savedNotice);
    } catch (error: any) {
        console.error("error");
        console.error(error);

        res.status(500).json({ message: error.message });
    }
};


// //************  Delete Notice ***************************/
export const deleteNotice = async (req: any, res: Response) => {
    const { noticeId } = req.params;
    const { id } = req.user;

    try {
        // Step 1: Find Account and check permission
        const findAccount = await Account.findById(id);
        if (!findAccount) return res.status(404).json({ message: 'Account not found' });

        // Step 2: Find the notice
        const notice = await Notice.findById(noticeId);
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        // Step 3: Check if the notice belongs to the user
        if (notice.academyID.toString() !== findAccount.id.toString()) {
            return res.status(403).json({ message: 'You do not have permission to delete this notice' });
        }

        // Step 4: Delete notice from MongoDB
        await Notice.findByIdAndDelete(noticeId);

        // Step 5: Delete notice file from Firebase Storage
        const storage = getStorage();
        const pdfRef = ref(storage, notice.pdf);
        await deleteObject(pdfRef);

        res.status(200).json({ message: 'Notice deleted successfully' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};



//************  join noticeboard ***************************/

export const joinNoticeboard = async (req: any, res: Response) => {
    const { academyID } = req.params;
    const { id } = req.user;

    try {
        if (!academyID) {
            return res.status(400).json({ message: 'AcademyID is required' });
        }

        // Check if the account exists
        const account = await Account.findById(academyID);
        if (!account) {
            return res.status(404).json({ message: 'Academy not found' });
        }

        // Check if the user is already a member
        const existingMember = await NoticeBoardMember.findOne({
            academyID,
            memberID: id,
        });
        if (existingMember) {
            return res.status(409).json({ message: 'You are already a member' });
        }

        // Join as a member
        const newMember = new NoticeBoardMember({
            academyID,
            memberID: id,
        });

        // Save and send the response
        await newMember.save();
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
        if (!academyID) {
            return res.status(400).json({ message: 'AcademyID is required' });
        }

        // Check if the account exists
        const findAcademy = await Account.findById(academyID);
        if (!findAcademy)
            return res.status(404).json({ message: 'Account not found' });


        // Check if the user is already a member
        const allradyMember = await NoticeBoardMember.findOne({
            academyID,
            memberID: id,
        });
        if (!allradyMember) {
            return res.status(404).json({ message: 'You have already left' });
        }

        // Delete the member
        await NoticeBoardMember.findOneAndDelete({
            academyID,
            memberID: id,
        });

        res.send({
            message: 'Successfully left the noticeboard',
        });
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
        const allJoinedNoticeBaord = await NoticeBoardMember.find({ memberID: id }).select('-_id academyID');
        const academyIDs = allJoinedNoticeBaord.map((item: any) => item.academyID);

        const count = await Notice.countDocuments({ academyID: { $in: academyIDs } });
        const totalPages = Math.ceil(count / limit);

        const notices = await Notice.find({ academyID: { $in: academyIDs } })
            .select('-__v')
            .limit(limit)
            .populate({
                path: 'academyID',
                select: 'name username image',
            })
            .sort({ time: -1 });

        //notices

        //const final_notice_with_no_null_academtid = notices.filter(notice => notice.academyID !== null);
        const final_notice_with_no_null_academtid = notices.filter((notice: any) => notice.academyID !== null);

        // const noticesWithPDFs = await fb.getNoticePDFs(final_notice_with_no_null_academtid);

        res.status(200).json({
            message: "success All recent mnotice",
            notices: final_notice_with_no_null_academtid,
            currentPage: parseInt(page),
            totalPages,
            totalCount: count,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


// view all noties by notice id
export const recentNoticeByAcademeID = async (req: any, res: Response) => {
    const { academyID } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const findaccount = await Account.find({ id: academyID });
        if (!findaccount) return res.status(404).json({ message: "Acoount not found" });



        //
        const count = await Notice.countDocuments({ academyID: academyID });
        const totalPages = Math.ceil(count / limit);

        const notices = await Notice.find({ academyID: academyID })
            .select('-__v')
            .limit(limit)
            .populate({
                path: 'academyID',
                select: 'name username image',
            })
            .sort({ time: -1 });


        const final_notice_with_no_null_academtid = notices.filter((notice: any) => notice.academyID !== null);

        // const noticesWithPDFs = await fb.getNoticePDFs(notices);

        res.status(200).json({
            message: "success",
            notices: final_notice_with_no_null_academtid,
            currentPage: parseInt(page),
            totalPages,
            totalCount: count,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

//**************  current_user_status     *********** */
export const current_user_status = async (req: any, res: Response) => {
    try {
        const { academyID } = req.params;
        const { id } = req.user;
        console.log(academyID)

        let isOwner = false;
        let activeStatus = "not_joined";
        let isSave = false;
        let notificationOn = false;

        // Find the NoticeBoard to check user status
        const noticeBoard = await Account.findOne({ id: academyID });
        if (!noticeBoard) {
            return res.json({ message: "NoticeBoard not found" });
        }

        // Check if the user has a pending request
        const foundMember = await NoticeBoardMember.findOne({
            academyID: academyID,
            memberID: id
        });
        console.log(foundMember);

        if (foundMember) {
            activeStatus = "joined";
            // Check if the user is the owner
            if (foundMember.academyID.toString() === id) {
                isOwner = true;

                // Check if notification is enabled
                if (foundMember.notificationOn === true) {
                    notificationOn = true;
                }
            }


        }




        res.status(200).json({
            message: "Check noticeboard Status",
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




//************* Notification on /off **************//
export const notification_Off = async (req: any, res: Response) => {
    const { academyID } = req.params;
    const { id } = req.user;

    try {
        // Step 1: Find the academy account
        const academyAccount = await Account.findById(academyID);
        if (!academyAccount) {
            return res.status(404).json({ message: "Academy account not found" });
        }

        // Step 2: Check if the user is a member
        const foundMember = await NoticeBoardMember.findOne({ academyID: academyID, memberID: id });
        if (!foundMember) {
            return res.status(404).json({ message: "You are not a member of this Academy" });
        }

        // Step 3: Check if the user has already turned off notifications
        if (!foundMember.notificationOn) {
            return res.status(200).json({ message: "Notifications are already turned off", notificationOn: false });
        }

        // Step 4: Update notificationOn field to false
        await NoticeBoardMember.findOneAndUpdate({ academyID, memberID: id }, { notificationOn: false });
        res.status(200).json({ message: "Notifications turned off", notificationOn: false });


        //
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

//************* Notification on**************//

export const notification_On = async (req: any, res: Response) => {
    const { academyID } = req.params;
    const { id } = req.user;

    try {
        // Step 1: Find the academy account
        const academyAccount = await Account.findById(academyID);
        if (!academyAccount) {
            return res.status(404).json({ message: "Academy account not found" });
        }

        // Step 2: Check if the user is a member
        const foundMember = await NoticeBoardMember.findOne({ academyID: academyID, memberID: id });
        if (!foundMember) {
            return res.status(404).json({ message: "You are not a member of this Academy" });
        }

        // Step 3: Check if the user has already turned on notifications
        if (foundMember.notificationOn) {
            return res.status(200).json({ message: "Notifications are already turned on", notificationOn: true });
        }

        // Step 4: Update notificationOn field to true
        await NoticeBoardMember.findOneAndUpdate({ academyID, memberID: id }, { notificationOn: true });

        res.status(200).json({ message: "Notifications turned on", notificationOn: true });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

