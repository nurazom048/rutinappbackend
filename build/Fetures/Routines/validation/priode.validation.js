"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.periodModelValidation = void 0;
// Middleware for validation
const periodModelValidation = (req, res, next) => {
    try {
        const { priode_number, start_time, end_time } = req.body;
        const { routineID } = req.params;
        // if (!priode_number) {
        //     return res.status(400).send({ message: 'Validation failed: Please provide a period number' });
        // }
        if (priode_number <= 0) {
            return res.status(400).send({ message: 'Validation failed: Period number must be greater than zero' });
        }
        if (!start_time) {
            return res.status(400).send({ message: 'Validation failed: Start Time is required' });
        }
        if (!end_time) {
            return res.status(400).send({ message: 'Validation failed: end_time is required' });
        }
        if (!routineID) {
            return res.status(400).send({ message: 'Validation failed: routineID is required' });
        }
        // If all validations pass, proceed to the next middleware/controller
        next();
    }
    catch (error) {
        // Handle any errors that occur during validation
        res.status(500).send({ message: 'Internal server error' });
    }
};
exports.periodModelValidation = periodModelValidation;
