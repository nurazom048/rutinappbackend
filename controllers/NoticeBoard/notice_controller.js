
//! iports
const NoticeBoard = require('../../models/notice models/notice_bord');
const Notice = require('../../models/notice models/notice');


//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const firebase_stroage = require("../../config/firebase_stroges");
initializeApp(firebase_stroage.firebaseConfig);// Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();


const fb = require("./firebase")

/// makea a add to 
//?_______________________________________________________________________________________!//

// created notice board 
exports.create_notice_board = async (req, res) => {
    // Extract the name and description from the request body
    const { name, description } = req.body;
    const { id } = req.user;

    try {

        const allradyExsisName = await NoticeBoard.findOne({ name, owner: id });
        console.log(allradyExsisName);
        if (allradyExsisName) return res.status(400).json({ message: "NoticeBoard name is allray exsit" });


        // Create a new notice board object with the name, description, and owner ID
        const noticeBoard = new NoticeBoard({ name, description, owner: id });
        // Save the new notice board object to the database
        const savedNoticeBoard = await noticeBoard.save();
        // Return a success response with the saved notice board object
        res.status(200).json({
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

    console.log(req.body)
    console.log(req.file)

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
        console.error(savedNotice);

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

// The endpoint to view a notice by its ID
exports.viewNoticeById = async (req, res) => {
    const { noticeId } = req.params;

    try {
        // Step 1: find the notice by its ID
        const notice = await Notice.findOne({ id: noticeId });
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        // Step 2: get the download URLs for all the PDFs in the notice
        const pdfUrls = await fb.getNoticePDFUrls(notice);

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

const Account = require('../../models/Account');

const mongoose = require('mongoose');








//! view notice bus username 


//
exports.viewNoticeByUsername = async (req, res) => {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        // Step 1: Find the account by username
        const account = await Account.findOne({ username: username });
        if (!account) return res.status(404).json({ message: 'Account not found' });

        // Step 2: Find the notices for the account and populate owner details
        const notices = await Notice.find(
            { owner: mongoose.Types.ObjectId(account._id), visibility: "public" },
            { content: 0, pinned_notice: 0, saved_routines: 0, __v: 0 }
        )
            .populate({
                path: 'noticeBoard',
                select: 'name',
                populate: {
                    path: 'owner',
                    select: 'name username image'
                }
            })
            .limit(limit)
            .skip((page - 1) * limit);

        const count = await Notice.countDocuments({ owner: mongoose.Types.ObjectId(account._id), visibility: "public" });

        // Step 3: Send the response
        const noticesWithPDFs = await fb.getNoticePDFs(notices);// from firebase
        res.json({
            message: 'All uploaded notices',
            notices: noticesWithPDFs,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


// make a function to send request to join
exports.sendRequest = async (req, res) => {

    const { noticeBoardId } = req.params;
    const { id } = req.user;

    try {
        // find notice board by id, if not found send not found response
        const noticeBoard = await NoticeBoard.findOne({ id: noticeBoardId });
        if (!noticeBoard) return res.status(404).json({ message: 'Notice board not found', });

        // check if the request has already been sent or not
        const requestSent = noticeBoard.joinRequest.includes(id);
        if (requestSent) return res.status(400).json({ message: 'Request already sent', request: noticeBoard.joinRequest });

        // check if the user is already a member
        const alreadyMember = noticeBoard.member.includes(id);
        if (alreadyMember) return res.status(400).json({ message: 'Already a member' });

        // push the account id into the join request array
        noticeBoard.joinRequest.push(id);
        noticeBoard.save();

        res.send({ message: "Request sent successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}



// unsend join request 
exports.unsendRequest = async (req, res) => {
    const { noticeBoardId } = req.params;
    const { id } = req.user;

    try {
        // find notice board by id, if not found send not found response
        const noticeBoard = await NoticeBoard.findOne({ id: noticeBoardId });
        if (!noticeBoard) return res.status(404).json({ message: 'Notice board not found' });

        // check if the request has been sent or not
        const requestSent = noticeBoard.joinRequest.includes(id);
        if (!requestSent) return res.status(400).json({ message: 'Request not found', request: noticeBoard.joinRequest });

        // remove the user's ID from the join request array
        noticeBoard.joinRequest = noticeBoard.joinRequest.filter(userId => userId !== id);
        noticeBoard.save();

        res.send({ message: "Request unsent successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}



//**********  see all the request **********//
exports.seeAllMebers = async (req, res) => {
    const { noticeBoardId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    console.log(noticeBoardId);

    try {
        // find the notice board by id, if not found send not found response
        const noticeBoard = await NoticeBoard.findOne({ id: noticeBoardId });
        if (!noticeBoard) return res.status(404).json({ message: 'Notice board not found' });

        // get all the join requests with populated account fields
        const skipCount = (page - 1) * limit;
        const findnoticeBoard = await NoticeBoard.findOne({ id: noticeBoardId })


            .select('member -_id')
            .slice('member', [skipCount, limit])
            .populate({
                path: 'member',
                select: 'name image username',
                model: 'Account',
            });

        if (!findnoticeBoard) {
            return res.status(404).send({ message: 'Not found' });
        }

        res.send({
            message: "All Members",
            mebers: findnoticeBoard.member,
            currentPage: page,
            totalPages: Math.ceil(findnoticeBoard.member.length / limit),
            totalCount: findnoticeBoard.member.length,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


//**********  see all the request **********//
exports.seeAllRequest = async (req, res) => {
    const { noticeBoardId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    console.log(noticeBoardId);

    try {
        // find the notice board by id, if not found send not found response
        const noticeBoard = await NoticeBoard.findOne({ id: noticeBoardId });
        if (!noticeBoard) return res.status(404).json({ message: 'Notice board not found' });

        // get all the join requests with populated account fields
        const skipCount = (page - 1) * limit;
        const joinRequests = await NoticeBoard.findOne({ id: noticeBoardId })
            .select('joinRequest -_id')
            .slice('joinRequest', [skipCount, limit])
            .populate({
                path: 'joinRequest',
                select: 'name image username',
                model: 'Account',
            });

        if (!joinRequests) {
            return res.status(404).send({ message: 'Not found' });
        }

        res.send({
            message: "All requested Members",
            joinRequests: joinRequests.joinRequest,
            currentPage: page,
            totalPages: Math.ceil(joinRequests.joinRequest.length / limit),
            totalCount: joinRequests.joinRequest.length,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


// Accept request add the user id into members aarry and delete from request array
exports.acceptRequest = async (req, res) => {
    const { noticeBoardId, userId } = req.params;

    try {
        // Step 1: find the notice board by id
        const noticeBoard = await NoticeBoard.findOne({ id: noticeBoardId });
        if (!noticeBoard) return res.status(404).json({ message: 'Notice board not found' });

        // Step 2: find the user by id
        const user = await Account.findOne({ id: userId }).select('name username about image');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Step 3: check if the user is already a member
        if (noticeBoard.member.includes(userId)) {
            return res.status(400).json({ message: 'User is already a member of the notice board' });
        }

        // Step 4: add user to member array and remove from join request array
        noticeBoard.member.push(userId);
        noticeBoard.joinRequest.pull(userId);
        await noticeBoard.save()



        res.send({ message: 'Request accepted successfully', account: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};






// Accept request add the user id into members aarry and delete from request array
exports.rejectRequest = async (req, res) => {
    const { noticeBoardId, userId } = req.params;

    try {
        // Step 1: find the notice board by id
        const noticeBoard = await NoticeBoard.findOne({ id: noticeBoardId });
        if (!noticeBoard) return res.status(404).json({ message: 'Notice board not found' });

        // Step 2: find the user by id
        const user = await Account.findOne({ id: userId }).select('name username about image');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Step 3: check if the user is in the jon request or not
        if (!noticeBoard.joinRequest.includes(userId)) {
            return res.status(400).json({ message: 'User not found on joind request' });
        }

        // Step 4: add user to join request array 
        noticeBoard.joinRequest.pull(userId);
        await noticeBoard.save()



        res.send({ message: 'Request rejected successfully', account: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
// see all joined notice board ...
exports.seeAllJoinedNoticeBoard = async (req, res) => {
    const { id } = req.user;
    const { page = 1, limit = 20 } = req.query;
    try {
        const count = await NoticeBoard.countDocuments({ member: id });
        const noticeBoards = await NoticeBoard.find({ member: id })
            .select('name')
            .populate({
                path: 'owner',
                select: 'name image username',
            })
            .limit(limit)
            .skip((page - 1) * limit);
        if (!noticeBoards) {
            return res.status(404).send({ message: 'Not found' });
        }
        res.status(200).json({
            noticeBoards,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalCount: count,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// see all joined notice board ...notices,,,

// recentNotice
exports.recentNotice = async (req, res) => {
    const { id } = req.user;
    const { page = 1, limit = 10 } = req.query;

    try {
        const noticeBoards = await NoticeBoard.find({ owner: id })
            .populate({
                path: "notices",
                select: "content_name pdf description time noticeBoard",
                populate: {
                    path: "noticeBoard",
                    select: "name",
                },
                options: { limit, skip: (page - 1) * limit, sort: { time: -1 } },
            })
            .lean();

        const notices = noticeBoards.reduce((acc, board) => {
            if (board.notices && board.notices.length > 0) {
                acc.push(...board.notices);
            }
            return acc;
        }, []);

        const count = notices.length;
        const totalPages = Math.ceil(count / limit);

        const noticesWithPDFs = await fb.getNoticePDFs(notices);

        res.status(200).json({
            message: "success",
            notices: noticesWithPDFs,
            currentPage: parseInt(page),
            totalPages: totalPages,
            totalCount: count,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// see all joined notice board ...
exports.seeAllJoinedNoticeBoard = async (req, res) => {
    const { id } = req.user;
    const { page = 1, limit = 20 } = req.query;
    try {
        const count = await NoticeBoard.countDocuments({ member: id });
        const noticeBoards = await NoticeBoard.find({ member: id })
            .select('name')
            .populate({
                path: 'owner',
                select: 'name image username',
            })
            .limit(limit)
            .skip((page - 1) * limit);
        if (!noticeBoards) {
            return res.status(404).send({ message: 'Not found' });
        }
        res.status(200).json({
            noticeBoards,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalCount: count,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// see all joined notice board ...notices,,,

// all notive borard owener by me
exports.AllNoticeBoard = async (req, res) => {
    const { id } = req.user;


    try {
        const noticeBoards = await NoticeBoard.find({ owner: id })
            .populate('owner', 'name username image')
            .select('name owner');

        res.status(200).json({
            message: "success",
            noticeBoards,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


//******************** search_notice_boards      **************************** */
exports.search_notice_boards = async (req, res) => {
    const { src } = req.query; // get the value of 'src' from the query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    console.log("from Notice search")
    console.log(src)

    try {
        const regex = new RegExp(src, "i");
        const count = await NoticeBoard.countDocuments({ name: regex });

        const noticeBoards = await NoticeBoard.find({ name: regex })
            .populate('owner', 'name username image')
            .select('name owner')
        // .limit(limit)
        // .skip((page - 1) * limit);

        if (!noticeBoards) return res.status(404).send({ message: "Not found" });

        res.status(200).json({
            message: "success",
            noticeBoards,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        res.send({ message: error.message });
    }
};


// view all noties by notice id
exports.allNoticesByNoticeBoardId = async (req, res) => {
    const { notice_boardId } = req.params;
    const { page = 1, limit = 4 } = req.query;

    try {
        const count = await Notice.find({ noticeBoard: notice_boardId }).countDocuments();
        const totalPages = Math.ceil(count / limit);

        const notices = await Notice.find({ noticeBoard: notice_boardId })
            .sort({ time: -1 }) // Sort by time in descending order
            .populate({
                path: 'noticeBoard',
                select: 'name',
            })
            .skip((page - 1) * limit)
            .limit(limit);

        const noticesWithPDFs = await fb.getNoticePDFs(notices);

        res.status(200).json({
            message: "All Notices list",
            notices: noticesWithPDFs,
            currentPage: parseInt(page),
            totalPages,
            totalCount: count,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//**************  current_user_status     *********** */
exports.current_user_status = async (req, res) => {
    try {
        const { noticeBoardId } = req.params;
        const { id, username } = req.user;

        let isOwner = false;
        let activeStatus = "not_joined";
        let isSave = false;
        let notificationOn = true;

        // Find the NoticeBoard to check user status
        const noticeBoard = await NoticeBoard.findOne({ _id: noticeBoardId });
        if (!noticeBoard) return res.json({ message: "NoticeBoard not found" });



        // Check if the user has saved the routine
        const findAccount = await Account.findOne({ username });
        if (!findAccount) {
            return res.status(200).json({
                isOwner,
                activeStatus,
                sentRequestCount,
            });
        }

        // Check if the user is the owner
        if (noticeBoard.owner.toString() === req.user.id) {
            isOwner = true;
        }

        // Check if the user is an active member
        const alreadyMember = noticeBoard.member.includes(id);
        if (alreadyMember) {
            activeStatus = "joined";
        }

        // Check if the user has a pending request
        const pendingRequest = noticeBoard.joinRequest.includes(id);
        if (pendingRequest) {
            activeStatus = "request_pending";
        }

        // Check if notification is enabled
        const notificationOff = noticeBoard.notificationOn.includes(id);
        if (!notificationOff) {
            notificationOn = false;
        }

        res.status(200).json({

            message: "Chack noticeboard Status",
            isOwner,
            activeStatus,
            isSave,
            notificationOn,
        });
    } catch (error) {
        res.send({ message: error.message });
    }
};



// unsend join request 
exports.leaveNoticeBoard = async (req, res) => {
    const { noticeBoardId } = req.params;
    const { id } = req.user;

    try {
        // find account
        const account = await Account.findOne({ id }).select('name username about image');
        if (!account) return res.status(404).json({ message: 'Account not found' });

        // find notice board by id, if not found send not found response
        const noticeBoard = await NoticeBoard.findOne({ id: noticeBoardId });
        if (!noticeBoard) return res.status(404).json({ message: 'Notice board not found' });

        // check if the request has been sent or not
        const isMember = noticeBoard.member.includes(id);
        if (!isMember) return res.status(400).json({ message: 'Allrady leave ' });

        // remove the user's ID from the join request array
        noticeBoard.joinRequest = noticeBoard.member.pull(id);
        noticeBoard.save();

        res.send({ message: "Userremove sucsessfull", account });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

// unsend join request 
exports.kickOut = async (req, res) => {
    const { noticeBoardId } = req.params;
    const { id } = req.user;

    try {
        // find account
        const account = await Account.findOne({ id }).select('name username about image');
        if (!account) return res.status(404).json({ message: 'Account not found' });

        // find notice board by id, if not found send not found response
        const noticeBoard = await NoticeBoard.findOne({ id: noticeBoardId });
        if (!noticeBoard) return res.status(404).json({ message: 'Notice board not found' });

        // check if the request has been sent or not
        const isMember = noticeBoard.member.includes(id);
        if (!isMember) return res.status(400).json({ message: 'Allrady leave ' });

        // remove the user's ID from the join request array
        noticeBoard.joinRequest = noticeBoard.member.pull(id);
        noticeBoard.save();

        res.send({ message: "Userremove sucsessfull", account });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}


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
//************* Notification on /off **************//

exports.notification_Off = async (req, res) => {
    const { noticeBoardId } = req.params;
    const { id } = req.user;

    try {
        // Find notice board
        const noticeBord = await NoticeBoard.findById(noticeBoardId);
        if (!noticeBord) return res.json({ message: "NoticeBoard not found" });

        // Check if the user has already turned off notifications
        const isNotificationOn = noticeBord.notificationOn.includes(id);
        if (!isNotificationOn)
            return res.json({
                message: "Notifications are already turned off",
                notification_Off: true,
            });

        // Update the notice board by removing the user's ID from the notificationOn array
        await NoticeBoard.findOneAndUpdate(
            { _id: noticeBoardId },
            { $pull: { notificationOn: id } }
        );

        res.json({ message: "Notifications turned off", notification_Off: true });
    } catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
};

//************* Notification on**************//

exports.notification_on = async (req, res) => {
    const { noticeBoardId } = req.params;
    const { id } = req.user;

    try {
        // Find notice board
        const noticeBord = await NoticeBoard.findById(noticeBoardId);
        if (!noticeBord) return res.json({ message: "NoticeBoard not found" });

        // Check if the user has already turned on notifications
        const isNotificationOn = noticeBord.notificationOn.includes(id);
        if (isNotificationOn)
            return res.json({
                message: "Notifications are already turned on",
                notification_Off: false,
            });

        // Update the notice board by pushing the user's ID to the notificationOn array
        await NoticeBoard.findOneAndUpdate(
            { _id: noticeBoardId },
            { $push: { notificationOn: id } }
        );

        res.json({ message: "Notifications turned on", notification_Off: false });
    } catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
};
