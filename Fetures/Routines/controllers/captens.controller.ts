import express, { Request, Response } from 'express';
import Account from '../../Account/models/Account.Model';
import Routine from '../models/routine.models';
import RoutineMember from '../models/routineMembers.Model';

//************   addCaptain      *************** */
export const addCaptain = async (req: any, res: Response) => {
    const { username } = req.body;
    const routineId = req.body.rutinid || req.body.routineID || req.body.routineId;

    try {
        const routine = await Routine.findOne({ _id: routineId });
        if (!routine) return res.json({ message: "Routine not found" });

        // Check if the logged-in user is the owner or captain
        const isHavePermission = await RoutineMember.findOne({ RutineID: routineId, memberID: req.user.id });
        if (!isHavePermission || (isHavePermission.captain === false && isHavePermission.owner === false)) {
            return res.json({ message: "Only the owner and captain can modify" });
        }

        const captainAccount = await Account.findOne({ username: username });
        if (!captainAccount) return res.json({ message: "Captain account not found" });

        const isMember = await RoutineMember.findOne({ RutineID: routineId, memberID: captainAccount._id });
        if (!isMember) return res.json({ message: "The account is not a member" });

        if (!isMember.captain) {
            isMember.captain = true;
            console.log(isMember);
            await isMember.save();
        }

        res.json({ message: "Captain added successfully" });
    } catch (error: any) {
        console.error(error);
        res.json({ message: error.toString() });
    }
};

//************   removeCaptain      *************** */
export const removeCaptain = async (req: any, res: Response) => {
    const { username } = req.body;
    const routineId = req.body.rutinid || req.body.routineID || req.body.routineId;

    try {
        const routine = await Routine.findOne({ _id: routineId });
        if (!routine) return res.json({ message: "Routine not found" });

        // Check if the logged-in user is the owner or captain
        const isHavePermission = await RoutineMember.findOne({ RutineID: routineId, memberID: req.user.id });
        if (!isHavePermission || isHavePermission.owner === false) {
            return res.json({ message: "Only the owner can modify" });
        }

        const captainAccount = await Account.findOne({ username: username });
        if (!captainAccount) return res.json({ message: "Captain account not found" });

        const isMember = await RoutineMember.findOne({ RutineID: routineId, memberID: captainAccount._id });
        if (!isMember) return res.json({ message: "The account is not a member" });

        if (isMember.captain) {
            isMember.captain = false;
            console.log(isMember);
            await isMember.save();
        }

        res.json({ message: "Captain removed successfully" });
    } catch (error: any) {
        console.error(error);
        res.json({ message: error.toString() });
    }
};
