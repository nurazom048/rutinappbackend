import { Request, Response, NextFunction } from 'express';

// Middleware for validation
export const weekdayValidation = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { room, num } = req.body;
        const { classID } = req.params;
        const number: number = Number(num);
        const start: number = Number(req.body.start);
        const end: number = Number(req.body.end);


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
        if (!start && start !== 0) {
            return res.status(400).send({ message: 'Validation failed: Start period is required' });
        }

        if (!end && end !== 0) {
            return res.status(400).send({ message: 'Validation failed: End period is required' });
        }
        // console.log(start)
        // console.log(end)
        if (start !== end) {
            if (end > start) {
                return res.status(400).send({ message: 'Validation failed: end period should be less than start period' });
            }
        }
        // If all validations pass, proceed to the next middleware/controller
        next();
    } catch (error) {
        // Handle any errors that occur during validation
        res.status(500).send({ message: 'Internal server error' });
    }
};


