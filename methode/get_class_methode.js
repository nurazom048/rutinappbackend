
const Class = require('../models/class_model');



exports.getClasses = async (classes, priodes) => {


    return classes.map(cls => {
        const startPriode = priodes.find(p => p.priode_number === cls.start);
        const endPriode = priodes.find(p => p.priode_number === cls.end);
        return {
            ...cls.toObject(),
            start_time: startPriode ? startPriode.start_time : null,
            end_time: endPriode ? endPriode.end_time : null,
        };
    });
};