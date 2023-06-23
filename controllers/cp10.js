
const Account = require('../models/Account');
const Routine = require('../models/rutin_models');
const RoutineMember = require('../models/rutineMembersModel');

//************   addCaptain      *************** */
exports.addCaptain = async (req, res) => {
    const { rutinid, username } = req.body;
    console.log(req.body);

    try {
        const routine = await Routine.findOne({ _id: rutinid });
        if (!routine) return res.json({ message: "Routine not found" });

        // Check if the logged-in user is the owner or captain
        const isHavePermission = await RoutineMember.findOne({ RutineID: rutinid, memberID: req.user.id });
        if (!isHavePermission || (isHavePermission.captain === false && isHavePermission.owner === false)) {
            return res.json({ message: "Only the owner and captain can modify" });
        }

        const captainAccount = await Account.findOne({ username: username });
        if (!captainAccount) return res.json({ message: "Captain account not found" });

        const isMember = await RoutineMember.findOne({ RutineID: rutinid, memberID: captainAccount._id });
        if (!isMember) return res.json({ message: "The account is not a member" });

        if (!isMember.captain) {
            isMember.captain = true;
            console.log(isMember)
            await isMember.save();
        }

        res.json({ message: "Captain added successfully" });
    } catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
};

//************   removeCaptain      *************** */
exports.removeCaptain = async (req, res) => {
    const { rutinid, username } = req.body;
    console.log(req.body);

    try {
        const routine = await Routine.findOne({ _id: rutinid });
        if (!routine) return res.json({ message: "Routine not found" });

        // Check if the logged-in user is the owner or captain
        const isHavePermission = await RoutineMember.findOne({ RutineID: rutinid, memberID: req.user.id });
        if (!isHavePermission || (isHavePermission.owner === false)) {
            return res.json({ message: "Only the owner can modify" });
        }

        const captainAccount = await Account.findOne({ username: username });
        if (!captainAccount) return res.json({ message: "Captain account not found" });

        const isMember = await RoutineMember.findOne({ RutineID: rutinid, memberID: captainAccount._id });
        if (!isMember) return res.json({ message: "The account is not a member" });

        if (isMember.captain) {
            isMember.captain = false;
            console.log(isMember);
            await isMember.save();
        }

        res.json({ message: "Captain removed successfully" });
    } catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
};



