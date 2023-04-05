
//! iports
const Notice = require('../models/notice_models');

//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const firebase_stroage = require("../config/firebase_stroges");
initializeApp(firebase_stroage.firebaseConfig);// Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();
const pdfRef = ref(storage, `notice/pdf`);



//?_______________________________________________________________________________________!//

// created noticed
exports.create_notice = async (req, res) => {
    // Extract the name and content from the request body
    const { name } = req.body;
    const { id } = req.user;

    console.log(req.user);

    try {
        // Create a new notice object with the name, content, and owner ID
        const notice = new Notice({ name, owner: id, });
        // Save the new notice object to the database
        const savedNotice = await notice.save();
        // Return a success response with the saved notice object
        res.status(201).json({
            message: 'Notice created successfully',
            notice: savedNotice,
        });
    } catch (err) {
        // If an error occurred, return an error response
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};



// Delete a notice
exports.deleteNotice = async (req, res) => {
    const { noticeId } = req.params;
    const { id } = req.user;

    try {
        // Find the notice to delete
        const notice = await Notice.findById(noticeId);

        if (!notice) return res.status(404).json({ message: 'Notice not found' });


        // Check if the notice belongs to the logged-in user
        if (notice.owner.toString() !== id) return res.status(401).json({ message: 'You are not authorized to delete this notice' });


        // Delete the notice
        await Notice.findByIdAndDelete(noticeId);

        res.json({ message: 'Notice deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


// Edit a notice
exports.editNotice = async (req, res) => {
    const { noticeId } = req.params;
    const { name } = req.body;
    const { id } = req.user;


    try {
        // 1 Find the notice to edit
        const notice = await Notice.findById(noticeId);
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        // 2 Check if the notice belongs to the logged-in user
        if (notice.owner.toString() !== id) return res.status(401).json({ message: 'You are not authorized to edit this notice' });

        // Update the notice name
        notice.name = name;
        const savedNotice = await notice.save();

        res.json({ message: 'Notice updated successfully', notice: savedNotice });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

const Account = require('../models/Account');

const mongoose = require('mongoose');
// viewNoticeByUsername
exports.viewNoticeByUsername = async (req, res) => {
    const { username } = req.params;

    try {
        const account = await Account.findOne({ username: username });
        if (!account) return res.status(404).json({ message: 'Account not found' });

        // Find the notice to delete
        const notice = await Notice.find({ owner: mongoose.Types.ObjectId(account._id) }, { content: 0, pined_notice: 0, saved_routines: 0, __v: 0 });
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        res.json({ message: 'all uploaded notice', notice });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


//!.... all content......//
exports.allContent = async (req, res) => {
    const { noticeId } = req.params;
    const { page = 1, limit = 20, contentName } = req.query;

    try {
        // Find the notice
        const notice = await Notice.findById(noticeId);
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        let sortedContent = notice.content.sort((a, b) => new Date(b.time) - new Date(a.time));

        // Filter content by name if contentName query param is present
        if (contentName) {
            sortedContent = sortedContent.filter((item) =>
                item.content_name.toLowerCase().includes(contentName.toLowerCase())
            );
        }

        // Get total count of content in the notice
        const count = sortedContent.length;

        // Calculate number of pages
        const totalPages = Math.ceil(count / limit);

        // Calculate start and end indexes for pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // Get content for the requested page
        const content = sortedContent.slice(startIndex, endIndex);

        // Extract relevant properties from each content item
        const formattedContent = content.map((item) => ({
            content_name: item.content_name,
            pdf: item.pdf,
            description: item.description,
            _id: item._id,
            time: item.time,
        }));


        // Add download URL for PDF files in the content
        const contentWithUrls = await Promise.all(
            formattedContent.map(async (item) => {
                if (item.pdf) {
                    const pdfRefItem = ref(pdfRef, item.pdf);
                    try {
                        const downloadUrl = await getDownloadURL(pdfRefItem);
                        return { ...item, pdfUrl: downloadUrl };
                    } catch (error) {
                        console.error(error);
                        return item;
                    }
                } else {
                    return item;
                }
            })
        );

        res.json({
            message: 'All content retrieved successfully',
            content: contentWithUrls,
            currentPage: page,
            totalPages,
            totalCount: count,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


//!... add content ....
exports.add_content = async (req, res) => {
    const { noticeId } = req.params;
    const { name, description } = req.body;
    const { id } = req.user;
    console.log("req.file");
    console.log(req.file);
    try {
        // Find the notice to add content to
        const notice = await Notice.findById(noticeId);
        if (!notice) return res.status(404).json({ message: 'Notice not found' });
        // Check if the notice belongs to the logged-in user
        if (notice.owner.toString() !== id) return res.status(401).json({ message: 'You are not authorized to add content to this notice' });

        // Upload the file to Firebase Storage
        const timestamp = Date.now();
        const filename = `${timestamp}-${req.file.originalname}`;   // Generate a unique filename 
        const metadata = { contentType: req.file.mimetype, };
        const storage = getStorage();    // Get a reference to the Firebase Storage bucket
        const pdfRef = ref(storage, `notice/pdf/${filename}`);    // Create a reference to the bucket
        await uploadBytes(pdfRef, req.file.buffer, metadata);   // Upload the file to Firebase Storage
        const url = await getDownloadURL(pdfRef);   // Get the download URL of the file

        // Add the content to the notice
        const content = { content_name: name, pdf: filename, description };
        notice.content.push(content);
        const lastSave = await notice.save();
        console.log(lastSave);

        res.status(200).json({ message: 'Content added successfully', content: { ...content, url } });


    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });



    }
};
//!... eddit content ....
exports.edit_content = async (req, res) => {
    const { noticeId, contentId } = req.params;
    const { name, description } = req.body;
    const { id } = req.user;

    try {
        // Find the notice
        const notice = await Notice.findById(noticeId);
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        // Check if the notice belongs to the logged-in user
        if (notice.owner.toString() !== id) return res.status(401).json({ message: 'You are not authorized to edit content in this notice' });

        // Find the content to edit
        const contentIndex = notice.content.findIndex(content => content._id.toString() === contentId);
        if (contentIndex === -1) return res.status(404).json({ message: 'Content not found' });
        const content = notice.content[contentIndex];

        // Upload a new file to Firebase Storage if provided
        let url = content.url;
        if (req.file) {
            const timestamp = Date.now();
            const filename = `${timestamp}-${req.file.originalname}`;   // Generate a unique filename 
            const metadata = { contentType: req.file.mimetype };
            const storage = getStorage();    // Get a reference to the Firebase Storage bucket
            const pdfRef = ref(storage, `notice/pdf/${filename}`);    // Create a reference to the bucket
            await uploadBytes(pdfRef, req.file.buffer, metadata);   // Upload the file to Firebase Storage
            url = await getDownloadURL(pdfRef);   // Get the download URL of the file
            content.filename = filename;
        }

        // Update the content
        content.content_name = name || content.content_name;
        content.description = description || content.description;
        content.url = url;
        notice.content.set(contentIndex, content);
        await notice.save();

        // Return a success message
        res.status(200).json({ message: 'Content updated successfully', content });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};



//!...view comtent 
exports.viewContent = async (req, res) => {
    const { contentId } = req.params;

    try {
        const notice = await Notice.findOne({ "content._id": contentId });
        const content = notice.content.find(c => c._id == contentId);

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        const storage = getStorage();
        const pdfRef = ref(storage, `notice/pdf/${content.pdf}`);
        const url = await getDownloadURL(pdfRef);

        res.status(200).json({ message: 'Content found', content: { ...content.toObject(), url } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
