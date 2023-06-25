const Account = require('../models/Account');
const Routine = require('../models/rutin_models');
const RoutineMember = require('../models/rutineMembersModel');




//**********  addMebers   ************* */
exports.addMebers = async (req, res) => {
  const { rutin_id, username } = req.params;

  try {
    // Check if the member's account exists
    const members_ac = await Account.findOne({ username });
    if (!members_ac) return res.json({ message: "Account not found" });

    // Find the routine to add the member to
    const routine = await Routine.findOne({ _id: rutin_id });
    if (!routine) return res.json({ message: "Routine not found" });

    // Check if the member is already added
    const alreadyAdded = routine.members.includes(members_ac._id.toString());
    if (alreadyAdded) return res.json({ message: "Member already added" });

    //add member
    const addmember = new RoutineMember({ memberID: members_ac._id }); // Create a new RoutineMember instance
    await addmember.save(); // Wait for the routineMember instance to be saved


    // Add the member to the routine
    routine.members.push(members_ac._id);
    const new_member = await routine.save();
    res.json({ message: "Member added successfully", addmember, new_member });

    //
  } catch (error) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};

//**********  removeMember   ************* */
exports.removeMember = async (req, res) => {
  const { rutin_id, username } = req.params;

  try {
    // Check if the member's account exists
    const member_ac = await Account.findOne({ username });
    if (!member_ac) return res.json({ message: "Account not found" });

    // Find the routine to remove the member from
    const routine = await Routine.findOne({ _id: rutin_id });
    if (!routine) return res.json({ message: "Routine not found" });

    // Check if the member is already added
    const ifMemberFound = new RoutineMember.findOne({ memberID: member_ac._id, RutineID: routine });
    if (!ifMemberFound) return res.json({ message: "Member Allrady removed" });

    const removeMember = new RoutineMember.findByIdAndRemove(ifMemberFound._id);

    // // Remove the member from the routine
    // routine.members = routine.members.filter((member) => member.toString() !== member_ac._id.toString());
    // const updated_routine = await routine.save();
    res.json({ message: "Member removed successfully", removeMember });

  } catch (error) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};

//***********  sendMemberRequest *************/

exports.sendMemberRequest = async (req, res) => {
  const { rutin_id } = req.params;
  const { username } = req.user;
  let activeStatus = "not_joined";

  try {
    // Check if the member's account exists
    const member_ac = await Account.findOne({ username });
    if (!member_ac) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Find the routine to remove the member from
    const routine = await Routine.findOne({ _id: rutin_id });
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    // Check if the member is already a part of the routine
    const isMember = await RoutineMember.findOne({ RutineID: rutin_id, memberID: member_ac.id });
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

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.toString() });
  }
};






//**********  see all member in rutin    ************* */
exports.allMembers = async (req, res) => {
  const { rutin_id } = req.params;
  console.log("allmembers");
  console.log(rutin_id);

  try {
    // Find the routine and its members
    const routine = await Routine.findOne({ _id: rutin_id }, { members: 1 });
    if (!routine) {
      return res.json({ message: "Routine not found" });
    }

    // Find the members and populate the memberID field
    const members = await RoutineMember.find({ RutineID: rutin_id })
      .select('-__v -blocklist -_id')
      .populate({
        path: 'memberID',
        select: '_id username name image',
        options: {
          sort: { createdAt: -1 },
        },
      });

    // Format the response by extracting the member objects
    const formattedMembers = members.map(({ memberID, notificationOn, captain, owner }) => {
      const { _id, username, name, image } = memberID;
      return {
        _id,
        username,
        name,
        image,
        notificationOn,
        captain,
        owner
      };
    });

    const count = formattedMembers.length;

    res.json({
      message: "All Members",
      count,
      members: formattedMembers
    });
  } catch (error) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};







//**********  see all member in rutin    ************* */
exports.allRequest = async (req, res) => {
  const { rutin_id } = req.params;

  console.log(rutin_id);

  try {
    // Find the routine and  member 
    const routine = await Routine.findOne({ _id: rutin_id }, { send_request: 1 })
      .populate({
        path: 'send_request',
        select: 'name username image',
        options: {
          sort: { createdAt: -1 },
        },
      });

    if (!routine) return res.json({ message: "Routine not found" });

    const count = routine.send_request.length;
    res.json({ message: "all new request ", count, allRequest: routine.send_request });

  } catch (error) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};




exports.acceptRequest = async (req, res) => {
  const { rutin_id } = req.params;
  const { username, acceptAll } = req.body;

  try {
    // Find the routine by ID
    const routine = await Routine.findById(rutin_id);
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }
    console.log(acceptAll)

    if (acceptAll === 'true') {
      // Accept all the requests in this routine
      for (let i = 0; i < routine.send_request.length; i++) {
        const memberId = routine.send_request[i];

        // Check if the member is already a member of the routine
        const isMember = await RoutineMember.findOne({ memberID: memberId, RutineID: rutin_id });

        if (!isMember) {
          // Remove the member from send_request array
          routine.send_request.pull(memberId);
          // Create a new RoutineMember object and save it
          const makeMember = new RoutineMember({ memberID: memberId, RutineID: rutin_id });
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
    const isMember = await RoutineMember.findOne({ memberID: member_ac._id, RutineID: rutin_id });
    if (isMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const updatedRoutine = await Routine.findOneAndUpdate(
      { _id: rutin_id },
      { $addToSet: { members: member_ac._id }, $pull: { send_request: member_ac._id } },
      { new: true }
    );

    // Create a new RoutineMember object and save it
    const makeMember = new RoutineMember({ memberID: member_ac._id, RutineID: rutin_id });
    await makeMember.save();

    res.json({ message: "Request accepted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.toString() });
  }
};

//*********** rejectMember *********************/
exports.rejectMember = async (req, res) => {
  const { rutin_id } = req.params;
  const { username } = req.body;

  try {
    const routine = await Routine.findById(rutin_id);
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
      { _id: rutin_id },
      { $pull: { send_request: member_ac._id } },
      { new: true }
    );


    res.status(200).json({ message: "Member request is rejected ", routine: updatedRoutine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.toString() });
  }
};


//********************  leave members  *****************//
exports.leave = async (req, res) => {
  const { rutin_id } = req.params;
  const { id } = req.user;
  console.log(rutin_id);

  try {
    // Step 1: Find the Routine
    const routine = await Routine.findById(rutin_id);
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    // Step 2: Check if the user is a member and not the owner
    const member = await RoutineMember.findOne({ memberID: id, RutineID: rutin_id });
    if (!member) {
      return res.status(404).json({ message: "User is not a member" });
    }
    if (member.owner) {
      return res.status(403).json({ message: "Owners cannot leave the routine" });
    }

    // Step 3: Remove the member and send a success message
    const leaveMember = await RoutineMember.findOneAndDelete({ memberID: id, RutineID: rutin_id });

    res.json({
      message: "Routine leave successful",
      activeStatus: "not_joined",
      routine: leaveMember
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};



//*****************   kickOut  ************************ */
exports.kickOut = async (req, res) => {
  const { rutin_id, memberid } = req.params;
  const { id } = req.user;
  console.log(rutin_id);
  console.log(memberid);

  try {
    // Step 1: Find the Routine and check permission
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    // Check if the logged-in user is the owner or a captain
    const isHavePermission = await RoutineMember.findOne({ RutineID: routine.id, memberID: req.user.id });
    if (!isHavePermission || (isHavePermission.owner === false && isHavePermission.captain === false)) {
      return res.json({ message: "Only the captain and owner can modify" });
    }

    // Check if the member is in the routine and not the owner
    const isMember = await RoutineMember.findOne({ RutineID: routine.id, memberID: memberid });
    if (!isMember) return res.status(400).json({ message: "User already removed" });
    if (isMember.owner === true) return res.status(400).json({ message: "No one can kick the owner" });

    // Remove the member and send a message
    await RoutineMember.findByIdAndDelete(isMember._id);

    res.json({ message: "The member is kicked out" });
  } catch (error) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};



// notification off

exports.notification_Off = async (req, res) => {
  const { rutin_id } = req.params;
  const { id } = req.user;

  try {
    // Find the routine by ID
    const routine = await Routine.findById(rutin_id);
    if (!routine) {
      return res.json({ message: "Routine not found" });
    }

    // Check if the user is a member of this routine
    const isMember = await RoutineMember.findOne({ RutineID: rutin_id, memberID: id });
    if (!isMember) {
      return res.json({ message: "You are not a member of this routine" });
    }

    // Check if the user has already turned on notifications
    const isNotificationAllrayOff = await RoutineMember.findOne({ RutineID: rutin_id, memberID: id, notificationOn: false });
    if (isNotificationAllrayOff) {
      return res.json({ message: "Notifications are already turned off", notificationOn: false });
    }

    // Update the notificationOn field to false for the user in the routine
    await RoutineMember.findOneAndUpdate({ RutineID: rutin_id, memberID: id }, { notificationOn: false });

    res.json({ message: "Notifications turned off", notificationOn: false });
  } catch (error) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};

// notification on
exports.notification_On = async (req, res) => {
  const { rutin_id } = req.params;
  const { id } = req.user;

  try {
    // Find the routine by ID
    const routine = await Routine.findById(rutin_id);
    if (!routine) {
      return res.json({ message: "Routine not found" });
    }

    // Check if the user is a member of this routine
    const isMember = await RoutineMember.findOne({ RutineID: rutin_id, memberID: id });
    if (!isMember) {
      return res.json({ message: "You are not a member of this routine" });
    }

    // Check if the user has already turned off notifications
    const isNotificationOAllradyOn = await RoutineMember.findOne({ RutineID: rutin_id, memberID: id, notificationOn: false });
    if (isNotificationOAllradyOn) {
      return res.json({ message: "Notifications are already turned on", notificationOn: true });
    }

    // Update the notificationOn 
    await RoutineMember.findOneAndUpdate({ RutineID: rutin_id, memberID: id }, { notificationOn: true });

    res.json({ message: "Notifications turned on", notificationOn: true });
  } catch (error) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};
