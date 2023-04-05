
const Class = require('../models/class_model');



exports.getClasses = async (weekday, rutin_id, priodes) => {
    const classes = await Class.find({ weekday, rutin_id })
        .select('-summary -__v -rutin_id')
        .sort({ start: 1 })
        .exec();

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