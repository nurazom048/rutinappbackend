
//! iports
const NoticeBoard = require('../models/notice models/notice_bord');
const Notice = require('../models/notice models/notice');


//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const firebase_stroage = require("../config/firebase_stroges");
initializeApp(firebase_stroage.firebaseConfig);// Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();



//?_______________________________________________________________________________________!//

// created notice board 
exports.create_notice_board = async (req, res) => {
    // Extract the name and description from the request body
    const { name, description } = req.body;
    const { id } = req.user;

    try {
        // Create a new notice board object with the name, description, and owner ID
        const noticeBoard = new NoticeBoard({ name, description, owner: id });
        // Save the new notice board object to the database
        const savedNoticeBoard = await noticeBoard.save();
        // Return a success response with the saved notice board object
        res.status(201).json({
            message: 'Notice board created successfully',
            notice_board: savedNoticeBoard,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};



exports.deleteNoticeBoard = async (req, res) => {
    const { noticeBoardId } = req.params;
    const { id } = req.user;

    try {
        // Find the notice board to delete
        const noticeBoard = await NoticeBoard.findById(noticeBoardId);

        if (!noticeBoard) return res.status(404).json({ message: 'Notice board not found' });

        // Check if the notice board belongs to the logged-in user
        if (noticeBoard.owner.toString() !== id) return res.status(401).json({ message: 'You are not authorized to delete this notice board' });

        // Delete the notice board and its associated notices
        const deletedNoticeBoard = await NoticeBoard.findByIdAndDelete(noticeBoardId);

        await Notice.deleteMany({ _id: { $in: deletedNoticeBoard.notices } });

        res.json({ message: 'Notice board and its associated notices deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
///......... write code to add notice to notice bode 
exports.addNotice = async (req, res) => {
    const { noticeId } = req.params;
    const { content_name, description } = req.body;
    const { id } = req.user;

    try {
        // step 1: Find the noticeBoard to check permission
        const noticeBoard = await NoticeBoard.findById(noticeId);
        if (!noticeBoard) return res.status(404).json({ message: 'NoticeBoard not found' });
        // Check if the noticeBoard belongs to the logged-in user
        if (noticeBoard.owner.toString() !== id) return res.status(401).json({ message: 'You can only add a notice to your own noticeBoard' });

        // step 2: Upload to Firebase Storage
        const timestamp = Date.now();
        const filename = `${timestamp}-${req.file.originalname}`; // Generate a unique filename
        const metadata = { contentType: req.file.mimetype };
        const storage = getStorage(); // Get a reference to the Firebase Storage bucket
        const pdfRef = ref(storage, `notice/pdf/${filename}`); // Create a reference to the bucket

        // step 3: Save to MongoDB with PDF filename
        const notice = new Notice({
            content_name,
            pdf: [{ url: filename }],
            description,
            noticeBoard: noticeBoard.id,
            visibility: 'public'
        });
        const savedNotice = await notice.save();

        // step 4: Add newly created notice ID to the noticeBoard
        noticeBoard.notices.push(savedNotice._id);
        await noticeBoard.save();
        await uploadBytes(pdfRef, req.file.buffer, metadata); // Upload the file to Firebase Storage

        res.status(200).json({ message: 'Notice created and added successfully', notice: savedNotice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }


};


exports.editNotice = async (req, res) => {
    const { noticeId } = req.params;
    const { name } = req.body;
    const { id } = req.user;

    try {
        // Find the notice board that the notice belongs to
        const noticeBoard = await NoticeBoard.findOne({ notices: noticeId });

        if (!noticeBoard) return res.status(404).json({ message: 'Notice board not found' });

        // Check if the notice board belongs to the logged-in user
        if (noticeBoard.owner.toString() !== id) return res.status(401).json({ message: 'You are not authorized to edit notices in this notice board' });

        // Find the notice to edit
        const notice = await Notice.findById(noticeId);

        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        // Update the notice name
        notice.name = name;
        const savedNotice = await notice.save();

        res.json({ message: 'Notice updated successfully', notice: savedNotice });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
// //!...view notice by notice id
// A helper function to get the download URLs for all the PDFs in a notice
const getNoticePDFUrls = async (notice) => {
    const urls = [];
    const storage = getStorage();

    // Loop through all the PDFs in the notice and get their download URLs
    for (let i = 0; i < notice.pdf.length; i++) {
        const pdfRef = ref(storage, `notice/pdf/${notice.pdf[i].url}`);
        const url = await getDownloadURL(pdfRef);
        urls.push({ url, _id: notice.pdf[i]._id });
    }

    return urls;
};

// The endpoint to view a notice by its ID
exports.viewNoticeById = async (req, res) => {
    const { noticeId } = req.params;

    try {
        // Step 1: find the notice by its ID
        const notice = await Notice.findOne({ id: noticeId });
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        // Step 2: get the download URLs for all the PDFs in the notice
        const pdfUrls = await getNoticePDFUrls(notice);

        // Step 3: send the response with the notice object and the PDF URLs
        res.status(200).json({
            message: 'Notice found',
            notice: {
                ...notice.toObject(), // Convert the notice object to a plain JavaScript object
                url: pdfUrls[0].url, // Add the download URL for the first PDF to the notice object
                pdf: pdfUrls // Add the download URLs for all the PDFs to the notice object
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const Account = require('../models/Account');

const mongoose = require('mongoose');








//! view notice bus username 

const getNoticePDFs = async (notices) => {
    for (let i = 0; i < notices.length; i++) {
        try {
            const notice = notices[i];
            const pdfUrls = await getNoticePDFUrls(notice);
            notice.pdf = pdfUrls;
        } catch (err) {
            console.error(err);
        }
    }
    return notices;
};
//
exports.viewNoticeByUsername = async (req, res) => {
    const { username } = req.params;

    try {

        // step 1 find account id
        const account = await Account.findOne({ username: username });
        if (!account) return res.status(404).json({ message: 'Account not found' });
        //find public 
        const notices = await Notice.find(
            { owner: mongoose.Types.ObjectId(account._id), visibility: "public" },
            { content: 0, pinned_notice: 0, saved_routines: 0, __v: 0 }
        ).populate({
            path: 'noticeBoard',
            select: 'name owner',
            populate: {
                path: 'owner',
                select: 'name username image'
            }
        });
        if (!notices) return res.status(404).json({ message: 'Notices not found' });

        const noticesWithPDFs = await getNoticePDFs(notices);

        res.json({ message: 'All uploaded notices', notices: noticesWithPDFs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// send join request








// //!.... all content......//
// exports.allContent = async (req, res) => {
//     const { noticeId } = req.params;
//     const { page = 1, limit = 20, contentName } = req.query;

//     try {
//         // Find the notice
//         const notice = await Notice.findById(noticeId);
//         if (!notice) return res.status(404).json({ message: 'Notice not found' });

//         let sortedContent = notice.content.sort((a, b) => new Date(b.time) - new Date(a.time));

//         // Filter content by name if contentName query param is present
//         if (contentName) {
//             sortedContent = sortedContent.filter((item) =>
//                 item.content_name.toLowerCase().includes(contentName.toLowerCase())
//             );
//         }

//         // Get total count of content in the notice
//         const count = sortedContent.length;

//         // Calculate number of pages
//         const totalPages = Math.ceil(count / limit);

//         // Calculate start and end indexes for pagination
//         const startIndex = (page - 1) * limit;
//         const endIndex = page * limit;

//         // Get content for the requested page
//         const content = sortedContent.slice(startIndex, endIndex);

//         // Extract relevant properties from each content item
//         const formattedContent = content.map((item) => ({
//             content_name: item.content_name,
//             pdf: item.pdf,
//             description: item.description,
//             _id: item._id,
//             time: item.time,
//         }));


//         // Add download URL for PDF files in the content
//         const contentWithUrls = await Promise.all(
//             formattedContent.map(async (item) => {
//                 if (item.pdf) {
//                     const pdfRefItem = ref(pdfRef, item.pdf);
//                     try {
//                         const downloadUrl = await getDownloadURL(pdfRefItem);
//                         return { ...item, pdfUrl: downloadUrl };
//                     } catch (error) {
//                         console.error(error);
//                         return item;
//                     }
//                 } else {
//                     return item;
//                 }
//             })
//         );

//         res.json({
//             message: 'All content retrieved successfully',
//             content: contentWithUrls,
//             currentPage: page,
//             totalPages,
//             totalCount: count,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };



// };
// //!... eddit content ....
// exports.edit_content = async (req, res) => {
//     const { noticeId, contentId } = req.params;
//     const { name, description } = req.body;
//     const { id } = req.user;

//     try {
//         // Find the notice
//         const notice = await Notice.findById(noticeId);
//         if (!notice) return res.status(404).json({ message: 'Notice not found' });

//         // Check if the notice belongs to the logged-in user
//         if (notice.owner.toString() !== id) return res.status(401).json({ message: 'You are not authorized to edit content in this notice' });

//         // Find the content to edit
//         const contentIndex = notice.content.findIndex(content => content._id.toString() === contentId);
//         if (contentIndex === -1) return res.status(404).json({ message: 'Content not found' });
//         const content = notice.content[contentIndex];

//         // Upload a new file to Firebase Storage if provided
//         let url = content.url;
//         if (req.file) {
//             const timestamp = Date.now();
//             const filename = `${timestamp}-${req.file.originalname}`;   // Generate a unique filename
//             const metadata = { contentType: req.file.mimetype };
//             const storage = getStorage();    // Get a reference to the Firebase Storage bucket
//             const pdfRef = ref(storage, `notice/pdf/${filename}`);    // Create a reference to the bucket
//             await uploadBytes(pdfRef, req.file.buffer, metadata);   // Upload the file to Firebase Storage
//             url = await getDownloadURL(pdfRef);   // Get the download URL of the file
//             content.filename = filename;
//         }

//         // Update the content
//         content.content_name = name || content.content_name;
//         content.description = description || content.description;
//         content.url = url;
//         notice.content.set(contentIndex, content);
//         await notice.save();

//         // Return a success message
//         res.status(200).json({ message: 'Content updated successfully', content });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: err.message });
//     }
// };






// ///..... get recent notice...........//

// exports.recent_notice = async (req, res) => {
//     const { id } = req.user;



//     try {
//         const recent_notice = await Notice.find({ pined_notice: { $in: id } }, { saved_routines: 0, pined_notice: 0, __v: 0 }).sort({ 'content.time': -1 });
//         res.status(200).json({ recent_notice });

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: err.message });
//     }
// };



// // add to pin .........
// exports.addToPin = async (req, res) => {
//     const { noticeId } = req.params;
//     const { id } = req.user;

//     try {
//         const notice = await Notice.findOne({ _id: noticeId });
//         if (!notice) return res.status(404).json({ message: 'Notice not found' });

//         const account = await Account.findOne({ _id: id });
//         if (!account) return res.status(404).json({ message: 'Account not found' });

//         // Check if notice is already pinned by the account
//         if (notice.pined_notice.includes(account._id)) {
//             return res.status(400).json({ message: 'Notice already pinned by the account' });
//         }

//         notice.pined_notice.push(account._id);
//         await notice.save();

//         res.status(200).json({ message: 'Notice pinned successfully' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: err.message });
//     }
// };
