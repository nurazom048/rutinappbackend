
const Class = require('../models/class_model');



exports.getClasses = async (classes, periods) => {


    return classes.map(cls => {
        const startPriode = periods.find(p => p.priode_number === cls.start);
        const endPriode = periods.find(p => p.priode_number === cls.end);
        return {
            ...cls.toObject(),
            start_time: startPriode ? startPriode.start_time : null,
            end_time: endPriode ? endPriode.end_time : null,
        };
    });
};









exports.getNotificationClasses = async (classes, periods) => {


    return classes.map(cls => {
        const startPriode = periods.find(p => p.priode_number === cls.start && p.rutin_id.toString() === cls.routine_id.toString());
        const endPriode = periods.find(p => p.priode_number === cls.end && p.rutin_id.toString() === cls.routine_id.toString());
        return {
            ...cls.toObject(),
            start_time: startPriode ? startPriode.start_time : null,
            end_time: endPriode ? endPriode.end_time : null,
        };
    });
};