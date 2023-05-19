
const Account = require('../models/Account');
const Routine = require('../models/rutin_models');

//************   add cap10       *************** */
exports.addCap10 = async (req, res) => {
    const { rutinid, username } = req.body;
    console.log(req.body);

    try {
        const rutin = await Routine.findOne({ _id: rutinid });
        if (!rutin) return res.json({ message: "Routine not found" });

        // Check if the logged-in user is the owner
        if (req.user.id !== rutin.ownerid.toString()) {
            return res.json({ message: "You are not the owner" });
        }

        const req_account = await Account.findOne({ username: username });
        if (!req_account) return res.json({ message: "Cap 10 account not found" });


        const alreadyAdded = await Routine.findOne({ _id: rutinid, cap10s: { $in: req_account._id } });
        if (alreadyAdded) return res.json({ message: "Cap 10 already added" });

        rutin.cap10s.push(req_account._id);

        const newCap10 = await rutin.save();
        res.send({ message: "Cap10 added successfully", newCap10 });
    } catch (error) {
        console.error(error);
        res.send({ message: error.toString() });
    }
};






//!....... Remove Cap10....//
exports.removeCap10 = async (req, res) => {
    const { rutinid, username } = req.body;
    const { id } = req.user;

    try {
        // Find the routine
        const rutin = await Routine.findOne({ _id: rutinid });
        if (!rutin) {
            return res.json({ message: "Routine not found" });
        }

        // Find the account .. the cap10 account you have to remove
        const account = await Account.findOne({ username });
        if (!account) {
            return res.json({ message: "Account not found" });
        }

        // Check if the logged-in user is the owner
        if (req.user.id.toString() !== rutin.ownerid.toString()) {
            return res.json({ message: "You are not the owner" });
        }

        // Remove the cap10
        rutin.cap10s.pull(account._id);

        // Save the updated routine
        const updatedRutin = await rutin.save();

        res.json({ message: "Cap 10 removed successfully", updatedRutin });
    } catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
};




exports.getAllCaptains = async (req, res) => {
    const { rutin_id } = req.params;


    try {
        // Find the routine
        const routine = await Routine.findOne({ _id: rutin_id }, { cap10s: 1 }).populate({
            path: 'cap10s',
            select: 'name username image'

        });
        if (!routine) return res.json({ message: "Routine not found" });

        // Populate the cap10s field with the captain's information
        const count = routine.cap10s.length;


        res.json({
            "message": "All captains list",
            "count": count,
            "captains": routine.cap10s,

        });

    } catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
};
