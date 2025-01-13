import express, { Request, Response } from 'express';
import prisma from '../../../prisma/schema/prisma.clint';
//***************************************************************************************/
//--------------------------- -addCaptain  --------------------------------------/
//**************************************************************************************/

export const addCaptain = async (req: any, res: Response) => {
    const { username, routineId } = req.body;
    const { id } = req.user;

    try {
        // Find the routine by its ID
        const routine = await prisma.routine.findUnique({ where: { id: routineId } });
        if (!routine) return res.status(404).json({ message: "Routine not found" });

        // Check if the logged-in user is the owner or captain of the routine
        const isHavePermission = await prisma.routineMember.findFirst({
            where: { routineId, accountId: id },
        });
        if (!isHavePermission || (!isHavePermission.captain && !isHavePermission.owner)) {
            return res.status(403).json({ message: "Only the owner and captain can modify" });
        }

        // Find the account for the new captain
        const captainAccount = await prisma.account.findUnique({ where: { username } });
        if (!captainAccount) return res.status(404).json({ message: "Captain account not found" });

        // Check if the captain is already a member of the routine
        const isMember = await prisma.routineMember.findFirst({
            where: { routineId, accountId: captainAccount.id },
        });
        if (!isMember) return res.status(400).json({ message: "The account is not a member of the routine" });

        // Update the routine member to set them as captain if they aren't already
        if (!isMember.captain) {
            await prisma.routineMember.update({
                where: { id: isMember.id },
                data: { captain: true },
            });
        }

        res.status(200).json({ message: "Captain added successfully", captainId: captainAccount.id });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.toString() });
    }
};

//***************************************************************************************/
//--------------------------- -removeCaptain  --------------------------------------/
//**************************************************************************************/

export const removeCaptain = async (req: any, res: Response) => {
    const { username, routineId } = req.body;
    const { id } = req.user;

    try {
        // Find the routine by its ID
        const routine = await prisma.routine.findUnique({ where: { id: routineId } });
        if (!routine) return res.status(404).json({ message: "Routine not found" });

        // Check if the logged-in user is the owner or captain of the routine
        const isHavePermission = await prisma.routineMember.findFirst({
            where: { routineId, accountId: id },
        });
        if (!isHavePermission || (!isHavePermission.captain && !isHavePermission.owner)) {
            return res.status(403).json({ message: "Only the owner and captain can modify" });
        }

        // Find the account for the captain to be removed
        const captainAccount = await prisma.account.findUnique({ where: { username } });
        if (!captainAccount) return res.status(404).json({ message: "Captain account not found" });

        // Check if the captain is already a member of the routine
        const isMember = await prisma.routineMember.findFirst({
            where: { routineId, accountId: captainAccount.id },
        });
        if (!isMember) return res.status(400).json({ message: "The account is not a member of the routine" });

        // Prevent removal of the captain if they are the only captain or if the logged-in user is not the owner
        if (isMember.captain && isHavePermission.owner === false) {
            return res.status(403).json({ message: "You cannot remove the last captain unless you are the owner" });
        }

        // Remove the captain status
        if (isMember.captain) {
            await prisma.routineMember.update({
                where: { id: isMember.id },
                data: { captain: false },
            });
        }

        res.status(200).json({ message: "Captain removed successfully" });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.toString() });
    }
};
