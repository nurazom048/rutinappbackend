const Account = require('../models/Account');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes ,getDownloadURL} = require('firebase/storage');
const firebase_stroage  = require("../config/firebase_stroges");

// Initialize Firebase
initializeApp(firebase_stroage.firebaseConfig);






// Account controller to update the account with an image
exports.edit_account = async (req, res) => {
  const { name }= req.body;
  console.log(req.body);

  try {
    const account = await Account.findOne({ _id: req.user.id });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    // Check if image was uploaded
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    // 1 upload firebsae and get URL
    const timestamp = Date.now();
    const filename = `${timestamp}-${req.file.originalname}`;   // Generate a unique filename 
    const metadata = {contentType: req.file.mimetype,};    // Set metadata for the uploaded image

    //... firebase storage 
    const storage = getStorage();    // Get a reference to the Firebase Storage bucket
    // Create a reference to the bucket
    const imageRef = ref(storage, `images/profile_picture/${filename}`);

    // Upload the image to the Firebase Storage bucket and get URL
    await uploadBytes(imageRef, req.file.buffer, metadata);
    const url = await getDownloadURL(imageRef);




    // 2 update the URL in MongoDB
    const update = await Account.findOneAndUpdate(
      { _id: req.user.id },
      { image: url, name },
      { new: true }
    );
    res.status(200).json({ message: 'Account updated successfully', update });


    //
  } catch (err) {
    console.error(err);
    // Delete the image from Firebase if there was an error
    if (imageRef) {
      await deleteObject(imageRef);
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
