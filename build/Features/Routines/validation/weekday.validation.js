"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weekdayValidation = void 0;
// Middleware for validation 
const weekdayValidation = (req, res, next) => {
    try {
        const { room, num, start_time, end_time } = req.body;
        const { classID } = req.params;
        const number = Number(num);
        const startTime = new Date(start_time).getTime();
        const endTime = new Date(end_time).getTime();
        if (!classID) {
            return res.status(400).send({ message: 'Validation failed: classId is required' });
        }
        if (!room) {
            return res.status(400).send({ message: 'Validation failed: room is required' });
        }
        if (!num && num !== 0) {
            return res.status(400).send({ message: 'Validation failed: Weekday number is required' });
        }
        if (![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(number)) {
            return res.status(400).send({ message: 'Validation failed: Invalid Weekday number' });
        }
        if (!start_time) {
            return res.status(400).send({ message: 'Validation failed: Start time is required' });
        }
        if (!end_time) {
            return res.status(400).send({ message: 'Validation failed: End time is required' });
        }
        if (endTime <= startTime) {
            return res.status(400).send({ message: 'Validation failed: End time should be greater than start time' });
        }
        // If all validations pass, proceed to the next middleware/controller
        next();
    }
    catch (error) {
        // Handle any errors that occur during validation
        res.status(500).send({ message: 'Internal server error' });
    }
};
exports.weekdayValidation = weekdayValidation;
