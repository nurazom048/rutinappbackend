const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const rutin_route = require('./routes/rutin_routes');
const auth_route = require('./routes/auth_route');
const class_route = require('./routes/class_route');
const summary = require('./routes/summary_route');
const account = require('./routes/account_route');
const cors = require("cors");

app.use(bodyParser.urlencoded());


app.use(cors());

//..... Connection....//
mongoose.connect('mongodb+srv://nurapp:rr1234@cluster0.wwfxxwu.mongodb.net/?retryWrites=true&w=majority')
  .then(() => console.log('Connected!'));
app.use(bodyParser.json());








// ------- Routes ------------------------//

app.use("/auth", auth_route); //.. auth_route
app.use("/rutin", rutin_route);//.. rutin_route
app.use("/class", class_route);//.. class_route
app.use("/summary", summary);//.. class_route
app.use("/account", account);//.. acount_route

app.get("/", (req, res) => {
  res.status(200).json({ message: "hi i am working" });
});













// const multer = require('multer');
// const { v4: uuidv4 } = require('uuid');
// const { initializeApp } = require('firebase/app');
// const { getStorage, ref, uploadBytes ,getDownloadURL} = require('firebase/storage');
// const firebase_stroage  = require("./config/firebase_stroges");
// const Account = require('./models/Account');
// const verifyToken = require("./varifitoken");


// // Initialize Firebase
// initializeApp(firebase_stroage.firebaseConfig);


// // Configure Multer middleware to handle file uploads
// const upload = multer({
//   storage: multer.memoryStorage(),
//   // limits: {
//   //   fileSize: 5 * 1024 * 1024 // 5 MB limit
//   // }
// });
// // Define a route to handle file uploads
// app.post('/image/upload', verifyToken,upload.single('image'), async (req, res) => {


//   console.log(req.body);
//     // Find account
//     const account = await Account.findOne({ _id: req.user.id });
//     if (!account) return res.status(404).json({ message: 'Account not found' });
//     // Check if image was uploaded
//     if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
//     // Check if name is not empty
//     if (!req.body.name)return res.status(400).json({ message: 'Name is required' });



//   try {

//    // Initialize Firebase
// initializeApp(firebase_stroage.firebaseConfig);


//     // 1 uplode firebsae ad get url

//     const timestamp = Date.now();
//     const filename = `${timestamp}-${req.file.originalname}`;   // Generate a unique filename 
//     const metadata = {contentType: req.file.mimetype,};    // Set metadata for the uploaded image


//     //... firebase stroage 
//     const storage = getStorage();    // Get a reference to the Firebase Storage bucket
//     // Create a reference to the bucket
//     const imageRef = ref(storage, `images/profile_picture/${filename}`);

//     // Upload the image to the Firebase Storage bucket
//     await uploadBytes(imageRef, req.file.buffer, metadata);

//     // Generate a public URL for the uploaded image
//     const url = await getDownloadURL(imageRef);





//     //...... 2 uploade the url to mongodeb.....//

//     const update = await Account.findOneAndUpdate(
//       { _id: req.user.id },
//       { image: url, name: req.body.name },
//       { new: true }
//     ).lean();



//     // Send response
//     console.log("File uploaded successfully to: ");
//     res.status(200).json({ message: 'Account updated successfully', update });




//     //
//   } catch (err) {
//     console.error(err);
//   // Delete the image from Firebase if there was an error
//   if (imageRef) {
//     await deleteObject(imageRef);
//   }
//   res.status(500).json({ message: 'Server Error', error: err.message });
//   }
// });





// //.. class_route



app.listen(3000, function () {
  console.log(" ****server started ********");
});