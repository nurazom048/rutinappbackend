
//! iports
const NoticeBoard = require('../../models/notice models/notice_bord');
const NoticeBoardMember = require('../../models/notice models/noticeboard_member');

const Notice = require('../../models/notice models/notice');
const Notification = require('../../models/notification.model');


const Account = require('../../models/Account');
const mongoose = require('mongoose');

//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_stroage = require("../../config/firebase_stroges");
initializeApp(firebase_stroage.firebaseConfig);// Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();


const fb = require("./firebase")
const { v4: uuidv4 } = require('uuid');


/// makea a add to 
//?_______________________________________________________________________________________!//

///......... write code to add notice to notice bode 
exports.addNotice = async (req, res) => {
    const { content_name, description } = req.body;
    const { id } = req.user;

    console.log(req.body);
    console.log(req.file);

    try {
        // Step 1: Find Account and check permission
        const findAccount = await Account.findById(id);
        if (!findAccount) return res.status(404).json({ message: 'Account not found' });
        // if (findAccount.account_type !== 'user')
        //     return res.status(404).json({ message: 'You do not have permission to add notice' });

        // Step 2: Upload to Firebase Storage
        const uuid = uuidv4();
        const metadata = { contentType: req.file.mimetype };
        const storage = getStorage(); // Get a reference to the Firebase Storage bucket
        const pdfRef = ref(storage, `notice/pdf/${uuid}`); // Create a reference to the bucket

        // Step 3: Save to MongoDB with PDF filename
        const notice = new Notice({
            _id: uuid, // Generate a unique UUID as _id
            content_name,
            pdf: uuid.toString(),
            description,
            academyID: findAccount.id,
        });
        const savedNotice = await notice.save();
        await uploadBytes(pdfRef, req.file.buffer, metadata); // Upload the file to Firebase Storage

        // Step 4: Create a notification
        const newNotification = new Notification({
            title: `A New Notice Added By ${findAccount.name}`,
            noticeId: notice._id, // Use the _id field of the notice
        });

        await newNotification.save();

        res.status(200).json({ message: 'Notice created and added successfully', notice: savedNotice, notice });
        console.log(savedNotice);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


//************  Delete Notice ***************************/
exports.deleteNotice = async (req, res) => {
    const { id } = req.params;

    try {
        // Step 1: Find the notice by its ID
        if (!id) res.status(404).json({ message: 'Id is requide' });
        const notice = await Notice.findOne({ id: id });
        if (!notice) {
            // Step 2: Delete the notice file from Firebase Storage if it exists
            try {
                const storage = getStorage(); // Get a reference to the Firebase Storage bucket
                const pdfRef = ref(storage, `notice/pdf/${id}`);
                await deleteObject(pdfRef);

                // Step 3: Delete the corresponding notification
                await Notification.deleteOne({ noticeId: id });

                return res.status(200).json({ message: 'Notice deleted successfully' });
            } catch (error) {
                console.error(error);
                return res.status(404).json({ message: 'Notice file not found', error: error.message });
            }
        }
        console.log(id)
        console.log(notice.pdf)

        // Step 3: Delete the notice file from Firebase Storage
        const storage = getStorage(); // Get a reference to the Firebase Storage bucket
        const pdfRef = ref(storage, `notice/pdf/${id}`);
        await deleteObject(pdfRef);

        // Step 4: Delete the corresponding notification
        await Notification.deleteOne({ noticeId: id });
        // Step 2: Delete the notice from MongoDB
        await notice.remove();

        res.status(200).json({ message: 'Notice deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};






//************  join noticeboard ***************************/

exports.joinNoticeboard = async (req, res) => {
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

//************  leaveMember ***************************/


exports.leaveMember = async (req, res) => {

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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};




// recentNotice
exports.recentNotice = async (req, res) => {
    const { id } = req.user;
    const { page = 1, limit = 10 } = req.query;

    try {
        const allJoinedNoticeBaord = await NoticeBoardMember.find({ memberID: id }).select('-_id academyID');
        const academyIDs = allJoinedNoticeBaord.map(item => item.academyID);

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

        const final_notice_with_no_null_academtid = notices.filter(notice => notice.academyID !== null);
        const noticesWithPDFs = await fb.getNoticePDFs(final_notice_with_no_null_academtid);

        res.status(200).json({
            message: "success All recent mnotice",
            notices: noticesWithPDFs,
            currentPage: parseInt(page),
            totalPages,
            totalCount: count,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


// view all noties by notice id
exports.recentNoticeByAcademeID = async (req, res) => {
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



        const noticesWithPDFs = await fb.getNoticePDFs(notices);

        res.status(200).json({
            message: "success",
            notices: noticesWithPDFs,
            currentPage: parseInt(page),
            totalPages,
            totalCount: count,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

//**************  current_user_status     *********** */
exports.current_user_status = async (req, res) => {
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
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};




//************* Notification on /off **************//
exports.notification_Off = async (req, res) => {
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

//************* Notification on**************//

exports.notification_On = async (req, res) => {
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

