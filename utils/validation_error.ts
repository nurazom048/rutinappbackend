import express, { Request, Response } from 'express';

export const handleValidationError = (res: Response, error: any) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).send({ message: 'Validation failed: ' + errors.join(', ') });
    return true;
  }
  return false;
};
