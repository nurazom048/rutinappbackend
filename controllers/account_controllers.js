const Account = require('../models/Account');


//? firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const firebase_stroage = require("../config/firebase_stroges");

// Initialize Firebase
initializeApp(firebase_stroage.firebaseConfig);

// Get a reference to the Firebase storage bucket
const storage = getStorage();
// const pdfRef = ref(storage, 'notice/pdf');




// Account controller to update the account with an image
exports.edit_account = async (req, res) => {
  const { name,username, about, email  } = req.body;
  // console.log(req.body.name);
  // console.log(req.file);
  console.log(req.body);
  console.log(req.file);


  try {
    // //... Chack Account ...//
    const account = await Account.findOne({ _id: req.user.id });
    if (!account) return res.status(404).json({ message: 'Account not found' });

   if(req.file){

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
    { name, image: url,username, about: about, },
    { new: true })


    res.status(200).json({ message: 'Account updated successfully', update });
   }



  
     // update withour file
  const update = await Account.findOneAndUpdate(
    { _id: req.user.id },
    { name, username, about: about,},
    { new: true })

    console.log(update);
    res.status(200).json({ message: 'Account updated successfully', update });


    //
  } catch (err) {
    console.error(err);
    // Delete the image from Firebase if there was an error
    if (req.file){
      if (imageRef) {
        await deleteObject(imageRef);
      }
      console.log(err);
      res.status(500).json({ message: err });
    }
  }
};
//........ View my account ...//
exports.view_my_account = async (req, res) => {


  try {
    const user = await Account.findOne({ _id: req.user.id },).select('-Saved_routines -routines -__v');

    console.error(user);
    if (!user) return res.status(404).json({ message: "Account not found" });


    return res.status(200).json(user);
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
