const Account = require('../models/Account');
const Notice = require('../models/notice_models');


//? firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const firebase_stroage = require("../config/firebase_stroges");

// Initialize Firebase
initializeApp(firebase_stroage.firebaseConfig);

// Get a reference to the Firebase storage bucket
const storage = getStorage();
const pdfRef = ref(storage, 'notice/pdf');


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





// Account controller to update the account with an image
exports.edit_account = async (req, res) => {
  const { name } = req.body;
  // console.log(req.body.name);
  // console.log(req.file);
  console.log(req.user);


  try {
    //... Chack Account ...//
    const account = await Account.findOne({ _id: req.user.id });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    // 1 upload firebsae and get URL
    const timestamp = Date.now();
    const filename = `${timestamp}-${req.file.originalname}`;   // Generate a unique filename 
    const metadata = { contentType: req.file.mimetype, };
    // Set metadata for the uploaded image

    //... firebase storage 
    const storage = getStorage();    // Get a reference to the Firebase Storage bucket
    const imageRef = ref(storage, `images/profile_picture/${filename}`);// Create a reference to the bucket

    // Upload the image to the Firebase Storage bucket and get URL
    await uploadBytes(imageRef, req.file.buffer, metadata);
    const url = await getDownloadURL(imageRef);




    // 2 update the URL in MongoDB
    const update = await Account.findOneAndUpdate(
      { _id: req.user.id },
      { name, image: url },
      { new: true }
    );
    console.log(update);
    res.status(200).json({ message: 'Account updated successfully', update });


    //
  } catch (err) {
    console.error(err);
    // Delete the image from Firebase if there was an error
    if (imageRef) {
      await deleteObject(imageRef);
    }
    console.log(err);
    res.status(500).json({ message: err });
  }
};
//........ View my account ...//
exports.view_my_account = async (req, res) => {


  try {
    const user = await Account.findOne({ _id: req.user.id },)
      .populate({
        path: 'routines Saved_routines',
        options: {
          sort: { createdAt: -1 },
        },
        populate: {
          path: 'ownerid',
          select: 'name username image',
        },
      });
    console.error(user);
    if (!user) return res.status(404).json({ message: "Account not found" });


    return res.status(200).json(user.toObject({ getters: true }));
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }











}







//....view others Account...//

exports.view_others_Account = async (req, res) => {

  const { username } = req.params;

  try {
    const user = await Account.findOne({ username }, { password: 0 })
      .populate({
        path: 'routines Saved_routines',
        options: {
          sort: { createdAt: -1 },
        },
        populate: {
          path: 'ownerid',
          select: 'name username image',
        },
      });


    if (!user) return res.status(404).json({ message: "User id not found " });

    return res.status(200).json(user.toObject({ getters: true }));

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting routines" });
  }
};




//.......... Search Account ....//

exports.searchAccounts = async (req, res) => {
  const { q: searchQuery = '', page = 1, limit = 10 } = req.query;
  console.log("search ac");
  console.log(req.query);

  try {
    const regex = new RegExp(searchQuery, 'i');
    const count = await Account.countDocuments({ username: { $regex: regex } });
    const accounts = await Account.find({ username: { $regex: regex } })
      .select('_id username name image')
      .limit(limit)
      .skip((page - 1) * limit);

    if (!accounts) {
      return res.status(404).send({ message: 'Not found' });
    }

    res.status(200).json({
      accounts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalCount: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
