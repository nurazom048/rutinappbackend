
const jwt = require('jsonwebtoken');
require('dotenv').config();

//

const Account = require('../../models/Account');
const PendingAccount = require('../../models/Account_model/pendigAccount.model')
//
exports.generateUsername = (email) => {
    const atIndex = email.indexOf("@");
    if (atIndex !== -1) {
        return email.substring(0, atIndex);
    }
    return email;
};

//
const generateUsername = (email) => {
    const atIndex = email.indexOf("@");
    if (atIndex !== -1) {
        return email.substring(0, atIndex);
    }
    return email;
};
// Generate uniq username 
exports.generateUniqUsername = async (email) => {
    const username = generateUsername(email);
    const isUsed = await Account.findOne({ username }) || await PendingAccount.findOne({ username });

    if (isUsed) {
        return username + Date.now();
    }
    return username;
};


//Methods: Generate Token
exports.generateJWT = (account) => {
    return jwt.sign({ id: account._id, username: account.username }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
    ;
};