import { Request, Response, NextFunction } from 'express';

// Middleware for validation
export const weekdayValidation = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { routine_id, class_id, room, num, start, end } = req.body;

        if (!routine_id) {
            return res.status(400).send({ message: 'Validation failed: routine_id is required' });
        }

        if (!class_id) {
            return res.status(400).send({ message: 'Validation failed: class_id is required' });
        }

        if (!room) {
            return res.status(400).send({ message: 'Validation failed: room is required' });
        }

        if (!num && num !== 0) {
            return res.status(400).send({ message: 'Validation failed: Weekday number is required' });
        }

        if (![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(num)) {
            return res.status(400).send({ message: 'Validation failed: Invalid Weekday number' });
        }

        if (!start && start !== 0) {
            return res.status(400).send({ message: 'Validation failed: Start period is required' });
        }

        if (!end && end !== 0) {
            return res.status(400).send({ message: 'Validation failed: End period is required' });
        }

        if (start >= end) {
            return res.status(400).send({ message: 'Validation failed: Start period should be less than End period' });
        }

        // If all validations pass, proceed to the next middleware/controller
        next();
    } catch (error) {
        // Handle any errors that occur during validation
        res.status(500).send({ message: 'Internal server error' });
    }
};


