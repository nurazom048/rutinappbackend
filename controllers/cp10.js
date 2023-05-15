
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
        res.json({ message: "Cap10 added successfully", newCap10 });
        console.error(res.json({ message: "Cap10 added successfully", newCap10 }));
    } catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
};






//!....... Remove Cap10....//
exports.removeCap10 = async (req, res) => {
    const { rutinid, username } = req.body;
    const { id } = req.user;

    try {
        const rutin = await Routine.findOne({ _id: rutinid });
        if (!rutin) return res.json({ message: "Routine not found" });

        const account = await Account.findOne({ _id: id });
        if (!account) return res.json({ message: "Account not found" });

        if (req.user.id !== rutin.ownerid.toString()) return res.json({ message: "You are not the owner" });

        const cap10Index = rutin.cap10s.findIndex(c => c.username.toString() === username.toString());
        if (cap10Index === -1) return res.json({ message: "Cap 10 not found" });

        rutin.cap10s.splice(cap10Index, 1);

        const updatedRutin = await rutin.save();
        res.json({ message: "Cap 10 removed successfully", updatedRutin });
    } catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
};



exports.getAllCaptains = async (req, res) => {
    const { rutin_id } = req.params;
    const { page = 1, limit = 10, q = '' } = req.query;
    console.log(q);

    const skip = (page - 1) * limit;
    const search = q ? {
        $or: [
            { 'username': { $regex: q, $options: 'i' } },
            { 'cap10s.cap10Ac.username': { $regex: q, $options: 'i' } }
        ]
    } : {};

    try {
        // Find the routine
        const routine = await Routine.findOne({ _id: rutin_id }, { cap10s: 1 });

        if (!routine) return res.json({ message: "Routine not found" });

        // Populate the cap10s field with the captain's information
        const count = routine.cap10s.length;
        const captains = await Routine.populate(routine, {
            path: 'cap10s.cap10Ac',
            select: 'name username image',
            match: search,
            options: { skip, limit },
        });

        const totalPages = Math.ceil(count / limit);
        const currentPage = page;

        const captainsList = {
            "message": "All captains list",
            "count": count,
            "totalPages": totalPages,
            "currentPage": currentPage,
            "captains": []
        };

        captains.cap10s.forEach(captain => {
            if (captain.cap10Ac) {
                captainsList.captains.push({
                    "cap10Ac": {
                        "name": captain.cap10Ac.name,
                        "username": captain.cap10Ac.username,
                        "image": captain.cap10Ac.image,
                        "id": captain.cap10Ac._id
                    },
                    "position": captain.position,
                    "_id": captain._id
                });
            }
        });

        res.json(captainsList);

    } catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
};
