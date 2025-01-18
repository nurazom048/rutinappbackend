import { Request, Response, NextFunction } from 'express';
// imports models
import prisma from '../../../prisma/schema/prisma.clint';


// WEEKDAY validation



// Middleware to validate the request body for creating a routine
export const createRoutineValidation = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ message: "The 'name' field is required and must be a non-empty string." });
  }

  next(); // Proceed to the next middleware or route handler
};



//@ Middleware to validate request and class existence
export const validateSummaryAddRequest = async (req: any, res: Response, next: NextFunction) => {
  const { message, checkedType } = req.body;
  const { classID } = req.params;

  try {
    // Step 1: Validate input
    if (!message?.trim() && req.files.length === 0 && !checkedType) {
      return res.status(400).send({
        message: 'Message is required, or at least one image must be uploaded.',
      });
    }

    // Step 2: Check if class exists
    const findClass = await prisma.class.findUnique({
      where: { id: classID },
    });

    if (!findClass) {
      return res.status(404).send({ message: 'Class not found' });
    }

    req.routineID = findClass.routineId;

    // Step 3: Validate file MIME types if files are uploaded
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    const invalidFiles = req.files.filter(
      (file: any) => !allowedMimeTypes.includes(file.mimetype)
    );

    if (invalidFiles.length > 0 && !checkedType) {
      const invalidFileNames = invalidFiles.map((file: any) => file.originalname);
      return res.status(400).send({
        message: `Invalid file types: ${invalidFileNames.join(', ')}`,
      });
    }

    // If all checks pass, continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error in validateSummaryRequest:', error);
    return res.status(500).send({ message: 'Server error occurred during validation.' });
  }
};
