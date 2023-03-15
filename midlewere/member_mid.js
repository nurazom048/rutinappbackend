
const Routine = require('../models/rutin_models');


exports.permition_add_member = async (req, res, next) => {
    const { rutin_id } = req.params;

    try {
        // 1. Find Routine and Priode
        const routine = await Routine.findOne({ _id: rutin_id });
        if (!routine) return res.status(404).json({ message: "Routine not found.mid" });

        // 2. Check permission is owner or captain
        const cap10s = routine.cap10s.map((c) => c.cap10Ac.toString());
        if (routine.ownerid.toString() == req.user.id || cap10s.includes(req.user.id)  ) {
            req.routine = routine;
            next();

       // user is not owner or captain
        } else return res.status(401).json({ message: "You don't have permission to add member" });
        

     
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error: " + err.message });
    }
};
