



const Routine = require('../models/rutin_models')





exports.Routine_Owner = async (req, res, next) => {
    const { id } = req.params;

    try {
        const routine = await Routine.findById(id);
        if (!routine) return res.status(404).json({ message: "Routine not found" });


        if (routine.ownerid.toString() !== req.user.id) {
            return res.status(401).json({ message: "Unauthorized to delete routine" });
        }


        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};


//....... Ruton Add permiyoom ..../// for ownwe and capten


