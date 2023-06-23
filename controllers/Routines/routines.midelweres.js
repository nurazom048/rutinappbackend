const Class = require('../../models/class_model');
const Priode = require('../../models/priodeModels');
const Routine = require('../../models/rutin_models')
const Weekday = require('../../models/weakdayModel');


// WEEKDAY vididation
exports.validateWeekdayMiddleware = async (req, res, next) => {
    const { class_id } = req.params;
    const { num, start, end } = req.body;

    try {
        // Check required fields
        if (!num) return res.status(400).send({ message: 'Weekday number is required' });
        if (!start) return res.status(400).send({ message: 'Start period is required' });
        if (!end) return res.status(400).send({ message: 'End period is required' });
        // Check from data base
        const classFind = await Class.findOne({ _id: class_id });
        if (!classFind) return res.status(404).send({ message: 'Class not found' });
        //
        const routine = await Routine.findOne({ _id: classFind.rutin_id });
        if (!routine) return res.status(404).send({ message: 'Routine not found' });


        // Period not created validations
        const findEnd = await Priode.findOne({ rutin_id: classFind.rutin_id, priode_number: start });
        const findStartPriod = await Priode.findOne({ rutin_id: classFind.rutin_id, priode_number: end });
        if (!findEnd) {
            return res.status(404).send({ message: `${end} period is not created` });
        }
        if (!findStartPriod) {
            return res.status(404).send({ message: `${start} period is not created` });
        }

        // Validation to check booking
        const startPriodeAlreadyBooked = await Weekday.findOne({ routine_id: classFind.rutin_id, num, start });
        if (startPriodeAlreadyBooked) {
            return res.status(404).send({ message: 'Start period is already booked' });
        }

        const endPriodeAlreadyBooked = await Weekday.findOne({ routine_id: classFind.rutin_id, num, end });
        if (endPriodeAlreadyBooked) {
            return res.status(404).send({ message: 'End period is already booked' });
        }

        // Check if any period is already booked within the range
        const mid = [];
        const allStart = await Weekday.find({ num });
        const allEnd = await Weekday.find({ num }, { end: 1 });

        for (let i = 0; i < allStart.length; i++) {
            for (let j = allStart[i].start + 1; j < allEnd[i].end; j++) {
                mid.push(j);
            }
        }

        if (mid.includes(start)) {
            return res.status(400).send({ message: `${start} This period is already booked. All bookings up to ${mid}` });
        }
        if (mid.includes(end)) {
            return res.status(400).send({ message: `This ${end} period is already booked. All bookings up to ${mid}` });
        }

        req.classFind = classFind;
        req.routine = routine;
        next();
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};
