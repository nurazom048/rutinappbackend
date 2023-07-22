import { Request, Response, NextFunction } from 'express';

export const classValidation = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, instuctor_name, subjectcode, weekday, rutin_id } = req.body;

        // Check if required fields are provided
        if (!name) {
            return res.status(400).send({ message: 'Validation failed: name is required' });
        }
        if (!instuctor_name) {
            return res.status(400).send({ message: 'Validation failed: instructor_name is required' });
        }
        if (!subjectcode) {
            return res.status(400).send({ message: 'Validation failed: subjectcode is required' });
        }
        if (!weekday || !Array.isArray(weekday) || weekday.length === 0) {
            return res.status(400).send({ message: 'Validation failed: weekday is required and must be a non-empty array' });
        }
        if (!rutin_id) {
            return res.status(400).send({ message: 'Validation failed: rutin_id is required' });
        }

        // If all validations pass, proceed to the next middleware/controller
        next();
    } catch (error) {
        // Handle any errors that occur during validation
        res.status(500).send({ message: 'Internal server error' });
    }
};
