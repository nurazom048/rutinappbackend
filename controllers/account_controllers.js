
const path = require('path');
const Account = require('../models/Account');
const fs = require('fs');

// Account controller to update the account with an image
exports.edit_account = async (req, res) => {
  try {
    // Find account
    const account = await Account.findOne({ _id: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Check if name is not empty
    if (!req.body.name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Update account
    const update = await Account.findOneAndUpdate(
      { _id: req.user.id },
      { image: req.file.filename, name: req.body.name },
      { new: true }
    ).lean();

    // Delete old image
    if (account.image) {
      const oldImagePath = path.join(__dirname, '..', 'upload/image/cover', account.image);
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log("Old image deleted successfully");
        }
      });
    }

    // Send response
    console.log("File uploaded successfully to: ", req.file.path);
    res.status(200).json({ message: 'Account updated successfully', update });
  } catch (err) {
    console.error(err);

    // Delete uploaded image if it exists
    if (req.file) {
      const imagePath = path.join(__dirname, '..', 'upload/image/cover', req.file.filename);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log("Uploaded image deleted successfully");
        }
      });
    }

    res.status(500).json({ message: 'Server Error', err });
  }
};