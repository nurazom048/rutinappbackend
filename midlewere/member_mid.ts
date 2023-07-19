
const Routine = require('../models/Routines Models/routine_models');

import { Request, Response, NextFunction } from 'express';

export const peremption_add_member = async (req: any, res: Response, next: NextFunction) => {
  const { rutin_id } = req.params;

  try {
    // 1. Find Routine and Pride
    const routine = await Routine.findOne({ _id: rutin_id });
    if (!routine) return res.status(404).json({ message: "Routine not found." });

    // 2. Check permission is owner or captain
    const cap10s = routine.cap10s.map((c: any) => c.cap10Ac.toString());
    if (routine.ownerid.toString() === req.user.id || cap10s.includes(req.user.id)) {
      req.routine = routine;
      next();
    } else {
      // user is not owner or captain
      return res.status(401).json({ message: "You don't have permission to add a member." });
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
};
