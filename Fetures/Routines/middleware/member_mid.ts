import { Request, Response, NextFunction } from 'express';
// Models
import Routine from '../models/routine.models';
import RoutineMember from '../models/routineMembers.Model';
import { printD, printError } from '../../../utils/utils';


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
//***************************************************************** */


// permission_add_prided
export const permission_add_Pride = async (req: any, res: Response, next: NextFunction) => {
  const { routineID } = req.params;

  try {

    // 1. Find Routine and Pride
    const routine = await Routine.findOne({ _id: routineID });
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    // 2. Check permission is owner or captain
    const routineMember = await RoutineMember.findOne({ RutineID: routineID, memberID: req.user.id });
    if (!routineMember?.owner && !routineMember?.captain!) {
      return res.status(401).json({ message: "You don't have permission to add priode" });
    }

    // req.routine = routine;
    next();
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
};

