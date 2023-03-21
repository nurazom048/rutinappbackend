
const Account = require('../models/Account');
const Routine = require('../models/rutin_models');

//************   add cap10       *************** */
exports.addCap10 = async (req, res) => {
    //const { username } =req.params;
    const { rutinid, position, username } = req.body;
    console.log(req.body);

    try {
        const rutin = await Routine.findOne({ _id: rutinid });
        if (!rutin) return res.json({ message: "Routine not found" });


        const account = await Account.findOne({ _id: rutin.ownerid });
        if (!account) return res.json({ message: "Account not found" });
        console.log(!account);

        if (req.user.id !== rutin.ownerid.toString()) return res.json({ message: "You are not the owner" });

        const req_account = await Account.findOne({ username: username });
        if (!req_account) return res.json({ message: "Cap 10 account not found" });

        const alreadyAdded = rutin.cap10s.find(c => c.cap10Ac.toString() === req_account._id.toString());
        if (alreadyAdded) return res.json({ message: "Cap 10 already added" });

        const new_cap10 = { cap10Ac: req_account._id, position };
        rutin.cap10s.push(new_cap10);

        const newCap10 = await rutin.save();
        res.json({ message: "Cap10 added successfully", newCap10 });
        console.error(res.json({ message: "Cap10 added successfully", newCap10 }));
    } catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
}






//!....... Remove Cap10....//
exports.removeCap10 = async (req, res) => {
    const { rutinid, cap10Ac } = req.body;

    try {
        const rutin = await Routine.findOne({ _id: rutinid });
        if (!rutin) return res.json({ message: "Routine not found" });

        if (req.user.id !== rutin.ownerid.toString()) return res.json({ message: "You are not the owner" });

        const cap10Index = rutin.cap10s.findIndex(c => c.cap10Ac.toString() === cap10Ac.toString());
        if (cap10Index === -1) return res.json({ message: "Cap 10 not found" });

        rutin.cap10s.splice(cap10Index, 1);

        const updatedRutin = await rutin.save();
        res.json({ message: "Cap 10 removed successfully", updatedRutin });
    } catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
};
