const Routine = require('../models/rutin_models');
const RoutineMember = require('../models/rutineMembersModel');

//**************    permition_add_priode    ************** */   
exports.permition_add_priode = async (req, res, next) => {
    const { rutin_id } = req.params;

    try {
        // 1. Find Routine and Priode
        const routine = await Routine.findOne({ _id: rutin_id });
        if (!routine) return res.status(404).json({ message: "Routine not found" });

        // 2. Check permission is owner or captain
        const routineMember = await RoutineMember.findOne({ RutineID: rutin_id, memberID: req.user.id })
        if (!routineMember.owner && !routineMember.captain) return res.status(401).json({ message: "You don't have permission to add priode" });
        req.routine = routine;
        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error: " + err.message });
    }
};






//**************    permition_remove_priode    ************** */

exports.permition_remove_priode = async (req, res, next) => {
    const { priodeId } = req.params;

    try {
        // 1. Find Routine and Priode
        const routine = await Routine.findOne({ "priode._id": priodeId });
        if (!routine) return res.status(404).json({ message: "Routine not found" });

        const priode = routine.priode.id(priodeId);
        if (!priode) return res.status(404).json({ message: "Priode not found" });


        // 2. Check permission is owner or captain
        const cap10s = routine.cap10s.map((c) => c.cap10Ac.toString());
        if (!((routine.ownerid.toString() == req.user.id || cap10s.includes(req.user.id)))) return res.status(401).json({ message: "You don't have permission to add" });


        req.routine = routine;
        req.priode = priode;

        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error: " + err.message });
    }
};


