
const PendigAccount = require('../../models/Account_model/pendigAccount.model');
const { admin } = require('../../controllers/auth_controllers');

//

// ***************** allPendigAccount *******************************/
exports.allPendingAccount = async (req, res) => {
    try {
        const accounts = await PendigAccount.find({ isAccept: false }).sort({ sendTime: 1 });
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
        const account = await PendigAccount.findById(id);
        if (account.isAccept) {
            return res.status(200).json({ message: "Request already accepted" });
        }

        try {
            // Check if email is taken or not
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
            email: account.email,
            password: account.password,
            emailVerified: false,
        });

        account.isAccept = true;
        const createdAccount = await account.save();

        res.status(200).json({ message: "Account created successfully", createdAccount, firebaseAuthCreate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error accepting pending request" });
    }
};

