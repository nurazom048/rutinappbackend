const Account = require('../models/Account');
const jwt = require('jsonwebtoken');

// Firebase auth
const admin = require('firebase-admin');
const serviceAccount = require('../rutinapp-cadc1-firebase-adminsdk-lwvsk-a3adebf91e.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//*********** loginAccount **********/
exports.loginAccount = async (req, res) => {
  const { username, password, phone, email } = req.body;

  try {
    let account;

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

    // Compare passwords
    if (password !== account.password) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Create a JWT token
    const token = jwt.sign({ id: account._id, username: account.username }, "secret", { expiresIn: "1d" });
    const claim = {
      jwt: token,
    }
    // Verify the user's email and password with Firebase
    const user = await admin.auth().getUserByEmail(account.email);
    // const user = await admin.auth().signInWithEmailAndPassword(account.email, password);
    const firebaselogin = await admin.auth().createCustomToken(account.id, claim);



    // Send response with token and account details
    res.status(200).json({ message: "Login successful", firebaselogin, token, account });
  } catch (error) {
    console.error(error);
    if (error.code === "auth/invalid-email") {
      // Handle invalid email error
      res.status(400).json({ message: "Invalid email" });
    } else {
      // Handle other Firebase errors
      res.status(500).json({ message: `Error logging in: ${error.message}` });
    }
  }
};




//***********   createAccount       **********/
exports.createAccount = async (req, res) => {
  const { name, username, password, phone, email } = req.body;

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

    // Create a new account
    const account = new Account({ name, username, password, phone, email });
    const firebaseAuthCreate = await admin.auth().createUser({
      displayName: account.name,
      uid: account.id,
      email: email,
      password: password,
      emailVerified: true,
    });

    const createdAccount = await account.save();

    // Send response
    res.status(200).json({ message: "Account created successfully", createdAccount, firebaseAuthCreate });
  } catch (error) {
    console.error(error);
    if (error.code === "auth/invalid-email") {
      // Handle invalid email error
      res.status(400).json({ message: "Invalid email" });
    } else if (error.code === "auth/email-already-in-use") {
      // Handle email already in use error
      res.status(400).json({ message: "Email already taken" });
    } else if (error.code === "auth/weak-password") {
      // Handle weak password error
      res.status(400).json({ message: "Weak password" });
    } else {
      // Handle other Firebase errors
      res.status(500).json({ message: `Error creating account: ${error.message}` });
    }
  }
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




