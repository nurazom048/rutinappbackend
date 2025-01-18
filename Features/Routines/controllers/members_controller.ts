import { Request, Response, NextFunction } from 'express';
import prisma from '../../../prisma/schema/prisma.clint';
import { printD } from '../../../utils/utils';
import { ActiveStatus } from '../../../utils/enums';



//**********  addMembers   ************* */
export const addMember = async (req: any, res: Response) => {
  const { routineID, username } = req.params;
  try {
    // Step 1: Check if the member's account exists
    const memberAccount = await prisma.account.findUnique({
      where: { username },
    });
    if (!memberAccount) return res.status(404).json({ message: "Account not found" });
    // Step 2: Find the routine to add the member to
    const routine = await prisma.routine.findUnique({
      where: { id: routineID },
    });
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    // Step 3: Check if the member is already added to the routine
    const alreadyAdded = await prisma.routineMember.findFirst({
      where: {
        routineId: routineID,
        accountId: memberAccount.id,
      },
    });
    if (alreadyAdded) return res.json({ message: "Member already added" });
    // Step 4: Add the member to the routine
    const addMember = await prisma.routineMember.create({
      data: {
        accountId: memberAccount.id,
        routineId: routine.id,
        notificationOn: false, // Default value
        captain: false, // Default value
        owner: false, // Default value
        isSaved: false, // Default value
        blacklist: false, // Default value
      },
    });

    // Step 5: Return the response with the added member details
    res.json({
      message: "Member added successfully",
      addMember,
      routine,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.toString() });
  }
};

//**********  removeMember   ************* */
export const removeMember = async (req: any, res: Response) => {
  const { routineID, username } = req.params;

  // TODO

  try {
    // // Check if the member's account exists
    // const member_ac = await Account.findOne({ username });
    // if (!member_ac) return res.json({ message: "Account not found" });

    // // Find the routine to remove the member from
    // const routine = await Routine.findOne({ _id: routineID });
    // if (!routine) return res.json({ message: "Routine not found" });

    // // Check if the member is already added
    // const ifMemberFound = await RoutineMember.findOne({ memberID: member_ac._id, RutineID: routine });
    // if (!ifMemberFound) return res.json({ message: "Member Already removed" });

    // const removeMember = await RoutineMember.findByIdAndDelete(ifMemberFound._id);

    // // // Remove the member from the routine
    // // routine.members = routine.members.filter((member) => member.toString() !== member_ac._id.toString());
    // // const updated_routine = await routine.save();
    // res.json({ message: "Member removed successfully", removeMember });

  } catch (error: any) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};


//***********  sendMemberRequest *************/

export const sendMemberRequest = async (req: any, res: Response) => {
  const { routineID } = req.params;
  const { username } = req.user;
  let activeStatus = "not_joined";

  try {
    // Find the member account using Prisma
    const member_ac = await prisma.account.findUnique({
      where: { username },
    });
    if (!member_ac) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Find the routine using Prisma
    const routine = await prisma.routine.findUnique({
      where: { id: routineID },
      include: {
        routineMembers: true, // Fetch related members to check if already joined
        RoutinesJoinRequest: true, // Fetch requests to check if already sent
      },
    });
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    // Check if the member is already a part of the routine
    const isMember = routine.routineMembers.some(
      (member: any) => member.accountId === member_ac.id
    );
    if (isMember) {
      activeStatus = "joined";
      return res.status(200).json({
        message: "User is already a member of the routine",
        activeStatus,
      });
    }

    // Check if the member's request has already been sent
    const alreadySent = routine.RoutinesJoinRequest.some(
      (request: any) => request.accountIdBy === member_ac.id
    );
    if (alreadySent) {
      activeStatus = "request_pending";
      return res.status(200).json({
        message: "Request already sent",
        activeStatus,
      });
    }

    // Create a new join request
    const newRequest = await prisma.routinesJoinRequest.create({
      data: {
        accountIdBy: member_ac.id,
        routineId: routine.id,
        requestMessage: req.body.requestMessage || "", // Optional request message
      },
    });

    activeStatus = "request_pending";
    res.status(200).json({
      message: "Request sent successfully",
      activeStatus,
      newRequest,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.toString() });
  }
};


//******* All Members in the  Routine  ***************/
export const allMembers = async (req: any, res: Response) => {
  const { routineID } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    // Step 1: Find the routine and check if it exists
    const routine = await prisma.routine.findUnique({
      where: { id: routineID },
      select: { id: true }, // We only need the routine ID to verify existence
    });

    if (!routine) {
      return res.status(404).json({ message: 'Routine not found' });
    }

    // Step 2: Count the total number of members
    const count = await prisma.routineMember.count({
      where: { routineId: routineID },
    });

    // Step 3: Calculate the total number of pages
    const totalPages = Math.ceil(count / parseInt(limit));

    // Step 4: Find the members with pagination and populate memberID
    const members = await prisma.routineMember.findMany({
      where: { routineId: routineID },
      select: {
        id: true,
        notificationOn: true,
        captain: true,
        owner: true,
        member: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    // Step 5: Format the response, removing null fields
    const formattedMembers = members.map((member) => {
      const formattedMember: any = {
        id: member.member.id,
        username: member.member.username,
        name: member.member.name,
        notificationOn: member.notificationOn,
        captain: member.captain,
        owner: member.owner,
      };

      // Only add image if it's not null
      if (member.member.image !== null) {
        formattedMember.image = member.member.image;
      }

      // Remove null fields from formatted member object
      return Object.fromEntries(Object.entries(formattedMember).filter(([_, v]) => v != null));
    });

    // Step 6: Return the response
    res.json({
      message: 'All Members',
      currentPage: parseInt(page),
      totalPages,
      totalCount: count,
      members: formattedMembers,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


//**********  see all member in routine    ************* */
export const allRequest = async (req: any, res: Response) => {
  const { routineID } = req.params;

  try {
    // Step 1: Find the routine and associated join requests
    const routine = await prisma.routine.findUnique({
      where: { id: routineID },
      select: {
        id: true,
        RoutinesJoinRequest: { // Assuming this is the relation to the join requests
          select: {
            id: true,
            requestMessage: true,
            requestedAccount: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              }
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc', // Sort by creation date
          },
        },
      },
    });

    if (!routine) {
      return res.status(404).json({ message: 'Routine not found' });
    }

    const count = routine.RoutinesJoinRequest.length; // Count the requests

    // Step 2: Format the response to exclude null fields
    const formattedRequests = routine.RoutinesJoinRequest.map(request => {
      const { requestedAccount, requestMessage, createdAt } = request;
      const { id, username, name, image } = requestedAccount || {};

      return {
        id,
        username,
        name,
        image: image ? image : undefined, // Don't include image if it's null
        requestMessage,
        createdAt,
      };
    });

    // Step 3: Return the formatted response
    res.json({
      message: 'All new requests',
      count,
      allRequest: formattedRequests,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.toString() });
  }
};



//**********  acceptRequest    ************* */

export const acceptRequest = async (req: any, res: Response) => {
  const { routineID } = req.params;
  const { username, acceptAll } = req.body;

  try {
    // Find the routine by ID
    const routine = await prisma.routine.findUnique({
      where: {
        id: routineID,
      },
      include: {
        RoutinesJoinRequest: true, // Include join requests related to the routine
      },
    });

    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    if (acceptAll === 'true') {
      // Accept all the requests in this routine
      for (let i = 0; i < routine.RoutinesJoinRequest.length; i++) {
        const request = routine.RoutinesJoinRequest[i];
        const memberId = request.accountIdBy;

        // Check if the member is already a member of the routine
        const isMember = await prisma.routineMember.findFirst({
          where: {
            accountId: memberId,
            routineId: routineID,
          },
        });

        if (!isMember) {
          // Perform the transaction to delete request and add the member to the routine
          await prisma.$transaction([
            prisma.routinesJoinRequest.deleteMany({
              where: {
                accountIdBy: memberId,
                routineId: routineID,
              },
            }),
            prisma.routineMember.create({
              data: {
                accountId: memberId,
                routineId: routineID,
              },
            }),
          ]);
        }
      }

      return res.json({ message: "All requests accepted" });
    }

    // Find the member account by username
    const member = await prisma.account.findUnique({
      where: {
        username: username,
      },
    });

    if (!member) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Check if the member is already a member of the routine
    const isMember = await prisma.routineMember.findFirst({
      where: {
        accountId: member.id,
        routineId: routineID,
      },
    });

    if (isMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // Perform the transaction to delete the join request and add the member
    await prisma.$transaction([
      prisma.routinesJoinRequest.deleteMany({
        where: {
          accountIdBy: member.id,
          routineId: routineID,
        },
      }),
      prisma.routineMember.create({
        data: {
          accountId: member.id,
          routineId: routineID,
        },
      }),
    ]);

    res.json({ message: "Request accepted" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.toString() });
  }
};


//*********** rejectMember *********************/
export const rejectMember = async (req: any, res: Response) => {
  const { routineID } = req.params;
  const { username } = req.body;
  // TODO  :

  try {
    // const routine = await Routine.findById(routineID);
    // if (!routine) {
    //   return res.status(404).json({ message: "Routine not found" });
    // }

    // const member_ac = await Account.findOne({ username });
    // if (!member_ac) {
    //   return res.status(404).json({ message: "Account not found" });
    // }

    // // Check if user_id is present in the send_request array
    // const isSendRequest = routine.send_request.includes(member_ac._id);
    // if (!isSendRequest) {
    //   return res.status(404).json({ message: "User id is not present in the send request array" });
    // }

    // const updatedRoutine = await Routine.findOneAndUpdate(
    //   { _id: routineID },
    //   { $pull: { send_request: member_ac._id } },
    //   { new: true }
    // );


    // res.status(200).json({ message: "Member request is rejected ", routine: updatedRoutine });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.toString() });
  }
};




//******************** Leave Members Functionality *****************//
export const leaveMember = async (req: any, res: Response) => {
  const { routineID } = req.params;
  const { id } = req.user;

  try {
    // Step 1: Find the Routine
    const routine = await prisma.routine.findUnique({
      where: { id: routineID },
    });
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    // Step 2: Check if the user is a member and not the owner
    const member = await prisma.routineMember.findFirst({
      where: {
        accountId: id,
        routineId: routineID,
      },
    });
    if (!member) {
      return res.status(404).json({ message: "User is not a member" });
    }
    if (member.owner) {
      return res.status(403).json({ message: "Owners cannot leave the routine" });
    }

    // Step 3: Remove the member and send a success message
    const leaveMember = await prisma.routineMember.delete({
      where: {
        id: member.id,
      },
    });

    res.json({
      message: "Routine leave successful",
      activeStatus: ActiveStatus.NOT_JOINED, // Use the enum value here
      routine: leaveMember,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};



//***************** Kick Out Member ************************//
export const kickOut = async (req: any, res: Response) => {
  const { routineID, memberID } = req.params;
  const { id } = req.user;

  try {
    // Step 1: Find the Routine and check permission
    const routine = await prisma.routine.findUnique({
      where: { id: routineID },
    });
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    // Check if the current user is the owner of the routine
    if (routine.ownerAccountId !== id)
      return res.status(403).json({ message: "Only the owner can kick out members" });


    // Step 2: Check if the member is in the routine
    const member = await prisma.routineMember.findFirst({
      where: {
        accountId: memberID,
        routineId: routineID,
      },
    });
    if (!member) {
      return res.status(404).json({ message: "Member not found in this routine" });
    }

    // Step 3: Prevent kicking out the owner
    if (member.owner) {
      return res.status(400).json({ message: "The owner cannot be removed from the routine" });
    }

    // Step 4: Remove the member
    await prisma.routineMember.delete({ where: { id: member.id } });

    res.json({ message: "Member successfully removed from the routine" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while removing the member" });
  }
};


//***************************************************************************************/
//----------------------------notification on/off --------------------------------------/
//**************************************************************************************/

export const notification_On = async (req: any, res: Response) => {
  const { routineID } = req.params;
  const { id: userId } = req.user;

  if (!routineID) {
    return res.status(400).json({ message: "Routine ID is required" });
  }

  try {
    // Find the routine by ID
    const routine = await prisma.routine.findUnique({ where: { id: routineID } });

    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    // Check if the user is a member of this routine
    const isMember = await prisma.routineMember.findFirst({
      where: { routineId: routineID, accountId: userId },
    });

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this routine" });
    }

    // Check if notifications are already turned on
    if (isMember.notificationOn) {
      return res.status(200).json({
        message: "Notifications are already turned on",
        notificationOn: true,
      });
    }

    // Update the `notificationOn` field to `true`
    await prisma.routineMember.update({
      where: { id: isMember.id },
      data: { notificationOn: true },
    });

    res.status(200).json({ message: "Notifications turned on", notificationOn: true });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};












export const notification_Off = async (req: any, res: Response) => {
  const { routineID } = req.params; // Use camelCase for consistency
  const { id: userId } = req.user; // Destructure `id` as `userId` for clarity
  printD('printing notificationOff');

  try {
    // Find the routine by ID
    const routine = await prisma.routine.findUnique({ where: { id: routineID } });
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    // Check if the user is a member of this routine
    const isMember = await prisma.routineMember.findFirst({
      where: { routineId: routineID, accountId: userId },
    });
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this routine" });
    }

    // Check if notifications are already turned off
    if (!isMember.notificationOn) {
      return res
        .status(200)
        .json({ message: "Notifications are already turned off", notificationOn: false });
    }

    // Update the `notificationOn` field to `false`
    await prisma.routineMember.update({
      where: { id: isMember.id },
      data: { notificationOn: false },
    });

    res.status(200).json({ message: "Notifications turned off", notificationOn: false });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.toString() });
  }
};
