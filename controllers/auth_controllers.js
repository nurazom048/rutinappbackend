const PendingAccount = require('../models/Account_model/pendigAccount.model');
const Account = require('../models/Account');
const jwt = require('jsonwebtoken');


// Firebase admin sdk from  Firebase config
const admin = require('firebase-admin');
const serviceAccount = require('../rutinapp-cadc1-firebase-adminsdk-lwvsk-a3adebf91e.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const firebseAdmine = admin;
//

// Firebase auth from  Firebase config
const firebaseApp = require('../config/firebase.config');
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const auth = getAuth(firebaseApp);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file
const bcrypt = require('bcrypt');
require('dotenv').config();

//*********** loginAccount **********/



exports.loginAccount = async (req, res) => {
  const { username, password, phone, email, osUserID } = req.body;
  console.log(req.body);


  try {
    let account;
    let pendingAccount;
    //.. check is pending or not 
    if (username) {
      pendingAccount = await PendingAccount.findOne({ username });

    }
    if (email) {
      pendingAccount = await PendingAccount.findOne({ email });
    }


    if (pendingAccount) {
      const pendingAccountCredential = await admin.auth().getUserByEmail(pendingAccount.email)
      console.log('pendingAccountCredential')
      console.log(pendingAccount)
      // Check if email is verified

      if (!pendingAccountCredential.emailVerified) {
        return res.status(401).json({ message: "Email is not verified", account: { email: pendingAccount.email }, pendigAccount: pendingAccount });
      }

      if (!pendingAccount.isAccept) {
        return res.status(402).json({ message: "Academy request is pending", account: { email: pendingAccount.email }, pendigAccount: pendingAccount });
      }
    }



    if (username) {
      // Find user by username
      account = await Account.findOne({ username });
    } else if (phone) {
      // Find user by phone
      account = await Account.findOne({ phone });
    } else if (email) {
      // Find user by email
      account = await Account.findOne({ email });
    }

    if (!account) {
      return res.status(400).json({ message: "User not found" });
    }
    if (account.googleSignIn) {
      return res.status(400).json({ message: "Try To Continue With Google" });
    }

    // Compare passwords
    const passwordMatch = bcrypt.compare(password, account.password);
    if (!passwordMatch && password == account.password) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Sign in with email and password on firebase
    const userCredential = await signInWithEmailAndPassword(auth, account.email, password);

    // Check if email is verified
    const user = userCredential.user;
    if (!user.emailVerified) {
      return res.status(401).json({ message: "Email is not verified", email: email, password: user, account });
    }


    // Create a JWT token
    const token = jwt.sign({ id: account._id, username: account.username }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

    //Encrypt the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find user and update password
    const updated = await Account.findByIdAndUpdate(account._id, { password: hashedPassword, osUserID: osUserID }, { new: true });
    console.log(updated)
    // Send response with token and account details
    res.status(200).json({ message: "Login successful", updated, token, account });
  } catch (error) {
    console.error(error);
    if (error.code === "auth/wrong-password") {
      // Handle invalid email error
      res.status(400).json({ message: "wrong password" });
    }

    else if (error.code === "auth/invalid-email") {
      // Handle invalid email error
      res.status(400).json({ message: "Invalid email" });
    } else {
      // Handle other Firebase errors
      res.status(500).json({ message: `Error logging in: ${error.message}` });
    }
  }
};


exports.createAccount = async (req, res) => {
  console.log(req.body)
  const { name, username, password, phone, email, account_type, EIIN, contractInfo } = req.body;

  try {
    // Validation
    if (!email) {
      return res.status(400).json({ message: "Must have email or phone number" });
    }
    if (!name || !username || !password) {
      return res.status(400).json({ message: "Please fill the form" });
    }

    // Check if email is already taken
    const emailAlreadyUsed = await Account.findOne({ email });
    if (emailAlreadyUsed) {
      return res.status(400).json({ message: "Email already taken" });
    }

    // Check if username is already taken
    const usernameAlreadyTaken = await Account.findOne({ username });
    if (usernameAlreadyTaken) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Check if phone number is already used
    if (phone) {
      const phoneNumberExists = await Account.findOne({ phone });
      if (phoneNumberExists) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }
    //! if academy move to pending request to create new account
    if (account_type == 'academy') {
      // Call the createPendingRequest function
      const response = await createPendingRequest(req, res);
      return res.status(200).json(response);
    } else {
      //Encrypt the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      const account = new Account({ name, username, password: hashedPassword, phone, email });

      // Check if email is taken or not
      try {
        await admin.auth().getUserByEmail(account.email.toString());
        return res.status(401).json({ message: "Email is already taken" });
      } catch (error) {
        if (error.code !== 'auth/user-not-found') {
          return res.status(500).json({ message: "Error checking email availability" });
        }
      }

      const firebaseAuthCreate = await admin.auth().createUser({
        displayName: account.name,
        uid: account.id,
        email: email,
        password: password,
        emailVerified: false,
      });

      const createdAccount = await account.save();

      // Send response
      res.status(200).json({ message: "Account created successfully", createdAccount, firebaseAuthCreate });


    }


  } catch (error) {
    console.error(error);
    if (error.code === "auth/invalid-email") {
      res.status(400).json({ message: "Invalid email" });
    } else if (error.code === "auth/email-already-in-use") {
      res.status(400).json({ message: "Email already taken" });
    } else if (error.code === "auth/weak-password") {
      res.status(400).json({ message: "Weak password" });
    } else {
      res.status(500).json({ message: `Error creating account: ${error.message}` });
    }
  }
};

// Create the createPendingRequest function
const createPendingRequest = async (req, res) => {
  const { name, username, password, phone, email, account_type, EIIN, contractInfo } = req.body;

  if (!EIIN) return { message: 'EIIN Number is required' };
  if (!contractInfo) return { message: 'contractInfo is required' };

  const emailAlreadyUsed = await PendingAccount.findOne({ email });
  if (emailAlreadyUsed) {
    return { message: "Request already pending with this email" };
  }

  const EIINAlreadyUsed = await PendingAccount.findOne({ EIIN });
  if (EIINAlreadyUsed) {
    return { message: "Request already pending with this EIIN" };
  }
  //Encrypt the new password
  const hashedPassword = await bcrypt.hash(password, 10);

  const account = new PendingAccount({
    name,
    username,
    password: hashedPassword,
    phone,
    email,
    account_type,
    contractInfo,
    EIIN,
  });

  const firebaseAuthCreate = await admin.auth().createUser({
    displayName: account.name,
    uid: account.id,
    email: email,
    password: password,
    emailVerified: false,
  });

  const createdAccount = await account.save();

  return { message: "Request sent successfully", createdAccount, firebaseAuthCreate };
};








//***********   deleteAccount       **********/
exports.deleteAccount = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(req.user);
    const findAccount = await Account.findById(id);
    if (!findAccount) return res.status(400).json({ message: "Account not found" });
    if (findAccount.id, toString() !== req.user.id) return res.status(" you can only delete your  Account ")
    // Send response 
    console.log(findAccount._id);

    // findAccount.delete();
    res.status(200).json({ message: "Account deleted successfully" });


  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting account" });
  }
};




//************** rejectPending ********************* */
exports.rejectPending = async (req, res) => {
  const { id } = req.params;

  try {
    const account = await PendingAccount.findById(id);
    if (account.isAccept) {
      return res.status(200).json({ message: "Request already accepted" });
    }

    // Delete user from Firebase authentication
    try {
      await admin.auth().deleteUser(account.id);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error deleting user from Firebase authentication" });
    }

    // Delete account from pending requests
    await PendingAccount.findByIdAndDelete(id);

    res.status(200).json({ message: "Account rejected and deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error rejecting pending request" });
  }
};
