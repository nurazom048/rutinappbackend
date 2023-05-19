const Account = require('../models/Account')
var jwt = require('jsonwebtoken');






//***********   createAccount       **********/
exports.createAccount = async (req, res) => {
  const { name, username, password, phone, email } = req.body;

  try {
    // validation
    if (!email && !phone)
      return res.status(400).json({ message: "Must have eamile or phone number" });
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
    const createdAccount = await account.save();

    // Send response
    res.status(200).json({ message: "Account created successfully", createdAccount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating account" });
  }
};





//***********   loginAccount       **********/

exports.login = async (req, res) => {
  const { username, password, phone, email } = req.body;
  console.log(req.body.password);
  try {



    let account;


    if (username) {

      // Find user by username
      account = await Account.findOne({ username }).populate({
        path: 'routines',
        select: 'name ownerid class',
        populate: {
          path: 'class',
          model: 'Class'
        }
      });

    }



    if (phone) {

      // Find user by phone
      account = await Account.findOne({ phone }).populate({
        path: 'routines',
        select: 'name ownerid class',
        populate: {
          path: 'class',
          model: 'Class'
        }
      });

    }
    if (email) {

      // Find user by phone
      account = await Account.findOne({ email }).populate({
        path: 'routines',
        select: 'name ownerid class',
        populate: {
          path: 'class',
          model: 'Class'
        }
      });

    }


    if (!account)
      return res.status(400).json({ message: "user  not found" });


    // Compare passwords
    if (password != account.password)
      return res.status(400).json({ message: "password incurrect" });

    // Create a JWT token

    const token = jwt.sign({ id: account._id, username: account.username }, "secret", { expiresIn: "1d" });

    // Send response with token
    res.status(200).json({ message: "Login successful", token, account });


  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in" });
  }
}







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




