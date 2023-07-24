import { Request, Response, NextFunction } from 'express';
// Models
import Account from '../../models/Account_model/Account.Model';
import Routine from '../../models/Routines Models/routine.models';
import RoutineMember from '../../models/Routines Models/routineMembers.Model';




//**********  addMembers   ************* */
export const addMember = async (req: any, res: Response) => {
  const { routineID, username } = req.params;

  try {
    // Check if the member's account exists
    const members_ac = await Account.findOne({ username });
    if (!members_ac) return res.json({ message: "Account not found" });

    // Find the routine to add the member to
    const routine = await Routine.findOne({ _id: routineID });
    if (!routine) return res.json({ message: "Routine not found" });

    // Check if the member is already added
    const alreadyAdded = routine.members.includes(members_ac._id.toString());
    if (alreadyAdded) return res.json({ message: "Member already added" });

    //add member
    const addMember = new RoutineMember({ memberID: members_ac._id }); // Create a new RoutineMember instance
    await addMember.save(); // Wait for the routineMember instance to be saved


    // Add the member to the routine
    routine.members.push(members_ac._id);
    const new_member = await routine.save();
    res.json({ message: "Member added successfully", addMember, new_member });

    //
  } catch (error: any) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};

//**********  removeMember   ************* */
export const removeMember = async (req: any, res: Response) => {
  const { routineID, username } = req.params;

  try {
    // Check if the member's account exists
    const member_ac = await Account.findOne({ username });
    if (!member_ac) return res.json({ message: "Account not found" });

    // Find the routine to remove the member from
    const routine = await Routine.findOne({ _id: routineID });
    if (!routine) return res.json({ message: "Routine not found" });

    // Check if the member is already added
    const ifMemberFound = await RoutineMember.findOne({ memberID: member_ac._id, RutineID: routine });
    if (!ifMemberFound) return res.json({ message: "Member Already removed" });

    const removeMember = RoutineMember.findByIdAndRemove(ifMemberFound._id);

    // // Remove the member from the routine
    // routine.members = routine.members.filter((member) => member.toString() !== member_ac._id.toString());
    // const updated_routine = await routine.save();
    res.json({ message: "Member removed successfully", removeMember });

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
    // Check if the member's account exists
    const member_ac = await Account.findOne({ username });
    if (!member_ac) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Find the routine to remove the member from
    const routine = await Routine.findOne({ _id: routineID });
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    // Check if the member is already a part of the routine
    const isMember = await RoutineMember.findOne({ RutineID: routineID, memberID: member_ac.id });
    if (isMember) {
      activeStatus = "joined";
      return res.status(200).json({ message: "User is already a member of the routine", activeStatus });
    }

    // Check if the member's request has already been sent
    const allradySend = routine.send_request.includes(member_ac._id.toString());
    if (allradySend) {
      activeStatus = "request_pending";
      return res.status(200).json({ message: "Request already sent", activeStatus });
    }

    // Add the member to the send request list
    routine.send_request.push(member_ac._id);
    const new_request = await routine.save();

    activeStatus = "request_pending";
    res.status(200).json({ message: "Request sent successfully", activeStatus });

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
    // Find the routine and its members
    const routine = await Routine.findOne({ _id: routineID }, { members: 1 });
    if (!routine) {
      return res.json({ message: "Routine not found" });
    }

    // Count the total number of members
    const count = await RoutineMember.countDocuments({ RutineID: routineID });

    // Calculate the total number of pages
    const totalPages = Math.ceil(count / limit);

    // Find the members and populate the memberID field with pagination
    const members = await RoutineMember.find({ RutineID: routineID })
      .select('-__v -blocklist -_id')
      .populate({
        path: 'memberID',
        model: Account,
        select: '_id username name image',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit),
          sort: { createdAt: -1 },
        },
      });

    // Format the response by extracting the member objects
    const formattedMembers = members
      .map(({ memberID, notificationOn, captain, owner }: any) => {
        if (!memberID) {
          return null; // Skip null memberID
        }
        const { _id, username, name, image } = memberID;
        return {
          _id,
          username,
          name,
          image,
          notificationOn,
          captain,
          owner,
        };
      })
      .filter((member: any) => member !== null);

    res.json({
      message: "All Members",
      currentPage: parseInt(page),
      totalPages,
      totalCount: count || 1,
      members: formattedMembers,
    });
  } catch (error: any) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};








//**********  see all member in rutin    ************* */
export const allRequest = async (req: any, res: Response) => {
  const { routineID } = req.params;

  // console.log(routineID);

  try {
    // Find the routine and  member 
    const routine = await Routine.findOne({ _id: routineID }, { send_request: 1 })
      .populate({
        path: 'send_request',
        model: Account,
        select: 'name username image',
        options: {
          sort: { createdAt: -1 },
        },
      });

    if (!routine) return res.json({ message: "Routine not found" });

    const count = routine.send_request.length;
    res.json({ message: "all new request ", count, allRequest: routine.send_request });

  } catch (error: any) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};




export const acceptRequest = async (req: any, res: Response) => {
  const { routineID } = req.params;
  const { username, acceptAll } = req.body;

  try {
    // Find the routine by ID
    const routine = await Routine.findById(routineID);
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }
    console.log(acceptAll)

    if (acceptAll === 'true') {
      // Accept all the requests in this routine
      for (let i = 0; i < routine.send_request.length; i++) {
        const memberId = routine.send_request[i];

        // Check if the member is already a member of the routine
        const isMember = await RoutineMember.findOne({ memberID: memberId, RutineID: routineID });

        if (!isMember) {
          // Remove the member from send_request array
          // routine.send_request.pull(memberId);
          await Routine.findOneAndUpdate({ _id: routineID },
            { $pull: { send_request: memberId } }
          );
          // Create a new RoutineMember object and save it
          const makeMember = new RoutineMember({ memberID: memberId, RutineID: routineID });
          await makeMember.save();

        }
      }

      // Save the updated routine
      await routine.save();
      return res.json({ message: "All requests accepted" });
    }


    // Find the member account by username
    const member_ac = await Account.findOne({ username });
    if (!member_ac) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Check if the member is already a member of the routine
    const isMember = await RoutineMember.findOne({ memberID: member_ac._id, RutineID: routineID });
    if (isMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const updatedRoutine = await Routine.findOneAndUpdate(
      { _id: routineID },
      { $addToSet: { members: member_ac._id }, $pull: { send_request: member_ac._id } },
      { new: true }
    );

    // Create a new RoutineMember object and save it
    const makeMember = new RoutineMember({ memberID: member_ac._id, RutineID: routineID });
    await makeMember.save();

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

  try {
    const routine = await Routine.findById(routineID);
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    const member_ac = await Account.findOne({ username });
    if (!member_ac) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Check if user_id is present in the send_request array
    const isSendRequest = routine.send_request.includes(member_ac._id);
    if (!isSendRequest) {
      return res.status(404).json({ message: "User id is not present in the send request array" });
    }

    const updatedRoutine = await Routine.findOneAndUpdate(
      { _id: routineID },
      { $pull: { send_request: member_ac._id } },
      { new: true }
    );


    res.status(200).json({ message: "Member request is rejected ", routine: updatedRoutine });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.toString() });
  }
};


//********************  leave members  *****************//
export const leave = async (req: any, res: Response) => {
  const { routineID } = req.params;
  const { id } = req.user;
  // console.log(routineID);

  try {
    // Step 1: Find the Routine
    const routine = await Routine.findById(routineID);
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    // Step 2: Check if the user is a member and not the owner
    const member = await RoutineMember.findOne({ memberID: id, RutineID: routineID });
    if (!member) {
      return res.status(404).json({ message: "User is not a member" });
    }
    if (member.owner) {
      return res.status(403).json({ message: "Owners cannot leave the routine" });
    }

    // Step 3: Remove the member and send a success message
    const leaveMember = await RoutineMember.findOneAndDelete({ memberID: id, RutineID: routineID });

    res.json({
      message: "Routine leave successful",
      activeStatus: "not_joined",
      routine: leaveMember
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};



//*****************   kickOut  ************************ */
export const kickOut = async (req: any, res: Response) => {
  const { routineID, memberID } = req.params;
  const { id } = req.user;
  // console.log(routineID);
  // console.log(memberID);

  try {
    // Step 1: Find the Routine and check permission
    const routine = await Routine.findById(routineID);
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    // Check if the logged-in user is the owner or a captain
    const isHavePermission = await RoutineMember.findOne({ RutineID: routine.id, memberID: req.user.id });
    if (!isHavePermission || (isHavePermission.owner === false && isHavePermission.captain === false)) {
      return res.json({ message: "Only the captain and owner can modify" });
    }

    // Check if the member is in the routine and not the owner
    const isMember = await RoutineMember.findOne({ RutineID: routine.id, memberID: routineID });
    if (!isMember) return res.status(400).json({ message: "User already removed" });
    if (isMember.owner === true) return res.status(400).json({ message: "No one can kick the owner" });

    // Remove the member and send a message
    await RoutineMember.findByIdAndDelete(isMember._id);

    res.json({ message: "The member is kicked out" });
  } catch (error: any) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};



// notification off

export const notification_Off = async (req: any, res: Response) => {
  const { routineID } = req.params;
  const { id } = req.user;

  try {
    // Find the routine by ID
    const routine = await Routine.findById(routineID);
    if (!routine) {
      return res.json({ message: "Routine not found" });
    }

    // Check if the user is a member of this routine
    const isMember = await RoutineMember.findOne({ RutineID: routineID, memberID: id });
    if (!isMember) {
      return res.json({ message: "You are not a member of this routine" });
    }

    // Check if the user has already turned on notifications
    const isNotificationAllrayOff = await RoutineMember.findOne({ RutineID: routineID, memberID: id, notificationOn: false });
    if (isNotificationAllrayOff) {
      return res.json({ message: "Notifications are already turned off", notificationOn: false });
    }

    // Update the notificationOn field to false for the user in the routine
    await RoutineMember.findOneAndUpdate({ RutineID: routineID, memberID: id }, { notificationOn: false });

    res.json({ message: "Notifications turned off", notificationOn: false });
  } catch (error: any) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};

// notification on
export const notification_On = async (req: any, res: Response) => {
  const { routineID } = req.params;
  const { id } = req.user;

  try {
    // Find the routine by ID
    const routine = await Routine.findById(routineID);
    if (!routine) {
      return res.json({ message: "Routine not found" });
    }

    // Check if the user is a member of this routine
    const isMember = await RoutineMember.findOne({ RutineID: routineID, memberID: id });
    if (!isMember) {
      return res.json({ message: "You are not a member of this routine" });
    }

    // Check if the user has already turned off notifications
    const isNotificationOAlreadyOn = await RoutineMember.findOne({ RutineID: routineID, memberID: id, notificationOn: true });
    if (isNotificationOAlreadyOn) {
      return res.json({ message: "Notifications are already turned on", notificationOn: true });
    }

    // Update the notificationOn 

    isMember.notificationOn = true;
    isMember.save()
    res.json({ message: "Notifications turned on", notificationOn: true });
  } catch (error: any) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};
