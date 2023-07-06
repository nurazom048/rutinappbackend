
const PendingAccount = require('../../models/Account_model/pendigAccount.model');
// const { admin } = require('../../controllers/auth_controllers');
const Account = require('../../models/Account');
const admin = require('firebase-admin');
//

// ***************** allPendingAccount *******************************/
exports.allPendingAccount = async (req, res) => {
    try {
        const accounts = await PendingAccount.find({ isAccept: false }).sort({ sendTime: 1 });
        res.status(200).json({ message: "All pending accounts", pendingAccounts: accounts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving pending accounts" });
    }
};

//************** acceptPending ********************* */
exports.acceptPending = async (req, res) => {
    const { id } = req.params;

    try {
        const pendingAccount = await PendingAccount.findById(id);
        console.log(pendingAccount)
        if (pendingAccount.isAccept) {
            return res.status(200).json({ message: "Request already accepted" });
        }
        const name = pendingAccount.name;
        const username = pendingAccount.username;
        const password = pendingAccount.password;
        const phone = pendingAccount.phone;
        const email = pendingAccount.email;
        const EIIN = pendingAccount.EIIN;

        try {
            // Check if email is taken or not
            const firebase = await admin.auth().getUserByEmail(pendingAccount.email.toString());
            if (!firebase) return res.status(401).json({ message: "User not found" });

        } catch (error) {
            if (error.code !== 'auth/user-not-found') {
                return res.status(500).json({ message: "Error checking email availability" });
            }
        }

        //

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




        // // create user
        const createNewAccount = new Account({ id, name, username, password, phone, email, EIIN });
        createNewAccount.save();

        // update the pending account 
        pendingAccount.isAccept = true;
        await pendingAccount.save();

        res.status(200).json({ message: "Account created successfully", createNewAccount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error accepting pending request" });
    }
};

