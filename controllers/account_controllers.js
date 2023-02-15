const Account = require('../models/Account')
var jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// eddit account
exports.eddit_account = async (req, res) => {
    try {
      const account = await Account.findOneAndUpdate(
        { _id: req.user.id },
        { image: req.file.filename }, // save the filename of the uploaded image
        { new: true }
      );
  
      if (!account)return res.status(404).json({ message: 'Account not found' });
      
    // delete old image if it exists
    if (account.image) {
        const imagePath = path.join(__dirname, '..', 'uploads', account.image);
        fs.unlink(imagePath, (err) => {
          if (err) console.error(err);
        });
      }
      console.log("File uploaded successfully to: ", req.file.path);
      res.status(200).json({ message: 'Account updated successfully', account });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  };

