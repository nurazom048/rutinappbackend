
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


/// join the academy user when he create academy account 


exports.joinHisOwnNoticeboard = async (academyID, id) => {

    try {
        // Check if the account exists
        const account = await Account.findById(academyID);
        if (!account) {
            return { message: 'Academy not found' };
        }

        // Check if the user is already a member
        const existingMember = await NoticeBoardMember.findOne({
            academyID,
            memberID: id,
        });
        if (existingMember) {
            return { message: 'You are already a member' };
        }

        // Join as a member
        const newMember = new NoticeBoardMember({
            academyID,
            memberID: id,
        });

        //  Save and send the response
        await newMember.save();

    } catch (error) {
        console.error(error);
        return { message: error.message };
    }
};