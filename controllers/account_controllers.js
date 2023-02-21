const Account = require('../models/Account');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes ,getDownloadURL} = require('firebase/storage');
const firebase_stroage  = require("../config/firebase_stroges");

// Initialize Firebase
initializeApp(firebase_stroage.firebaseConfig);






// Account controller to update the account with an image
exports.edit_account = async (req, res) => {
  const { name }= req.body;
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
    const metadata = {contentType: req.file.mimetype,}; 
     // Set metadata for the uploaded image

    //... firebase storage 
    const storage = getStorage();    // Get a reference to the Firebase Storage bucket
    const imageRef = ref(storage, `images/profile_picture/${filename}`);// Create a reference to the bucket

    // Upload the image to the Firebase Storage bucket and get URL
   await uploadBytes(imageRef, req.file.buffer, metadata);
    const url = await getDownloadURL(imageRef);




    // 2 update the URL in MongoDB
    const update = await Account.findOneAndUpdate(
      { _id : req.user.id },
      { name,  image: url },
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
    res.status(500).json({ message:  err });
  }
};
