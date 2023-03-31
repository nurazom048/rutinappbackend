




const Account = require('../models/Account');
const Notice = require('../models/notice_models');

//add content to notice
exports.add_content = async (req, res) => {
    const { noticeId } = req.params;
    const { name } = req.body;
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
        const file = req.file;


    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};









// created notice
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

// // all content
// exports.allContent = async (req, res) => {
//     const { noticeId } = req.params;

//     const { page = 1, limit = 10 } = req.query;

//     try {
//         // Find the notice
//         const notice = await Notice.findById(noticeId);
//         if (!notice) return res.status(404).json({ message: 'Notice not found' });

//         // Sort content by time in descending order (latest first)
//         const sortedContent = notice.content.sort((a, b) => b.time - a.time);

//         // Get total count of content in the notice
//         const count = sortedContent.length;

//         // Calculate number of pages
//         const totalPages = Math.ceil(count / limit);

//         // Calculate start and end indexes for pagination
//         const startIndex = (page - 1) * limit;
//         const endIndex = page * limit;

//         // Get content for the requested page
//         const content = sortedContent.slice(startIndex, endIndex);

//         res.status(200).json({
//             message: 'All content retrieved successfully',
//             content: content,
//             currentPage: parseInt(page),
//             totalPages: totalPages,
//             totalCount: count
//         });

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: err.message });
//     }
// };
