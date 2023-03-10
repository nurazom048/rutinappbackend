const Routine = require('../models/rutin_models');

//**************    permition_add_priode    ************** */   
exports.permition_add_priode = async (req, res, next) => {
    const { rutin_id } = req.params;

    try {
        // 1. Find Routine and Priode
        const routine = await Routine.findOne({ _id: rutin_id });
        if (!routine) return res.status(404).json({ message: "Routine not found" });




        // 2. Check permission is owner or captain
        if (routine.ownerid.toString() !== req.user.id) return res.status(401).json({ message: "You don't have permission to add" });


        const cap10s = routine.cap10s.map((c) => c.cap10Ac.toString());
        if (!cap10s.includes(req.user.id)) return res.status(401).json({ message: "You don't have permission to add" });


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
        if (routine.ownerid.toString() !== req.user.id) return res.status(401).json({ message: "You don't have permission to add" });


        const cap10s = routine.cap10s.map((c) => c.cap10Ac.toString());
        if (!cap10s.includes(req.user.id)) return res.status(401).json({ message: "You don't have permission to add" });


        req.routine = routine;
        req.priode = priode;

        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error: " + err.message });
    }
};


exports.vadlidator_add_priode = async (req, res, next) => {
    const { start_time, end_time } = req.body;

    try {
        if (!start_time || !end_time) return res.status(400).json({ message: "start_time and end_time are required" });
        next();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
