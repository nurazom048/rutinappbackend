const Account = require('../models/Account');
const Routine = require('../models/rutin_models');




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



exports.sendMemberRequest = async (req, res) => {
  const { rutin_id } = req.params;
  const { username } = req.user;
  let activeStatus = "not_joined";

  try {
    // Check if the member's account exists
    const member_ac = await Account.findOne({ username });
    if (!member_ac) return res.json({ message: "Account not found" });

    // Find the routine to remove the member from
    const routine = await Routine.findOne({ _id: rutin_id });
    if (!routine) return res.json({ message: "Routine not found" });

    // Check if the member is already added
    const allradySend = routine.send_request.includes(member_ac._id.toString());
    if (allradySend) {
      activeStatus = "request_pending"
      return res.json({ message: "Request already sent", activeStatus });
    }

    // Check if the member is already a part of the routine
    const isMember = routine.members.includes(member_ac._id.toString());
    if (isMember) {
      activeStatus = "joined"


      return res.json({ message: "User is already a member of the routine", activeStatus });
    }

    // Add the member to send request
    routine.send_request.push(member_ac._id);
    const new_request = await routine.save();
    activeStatus = "request_pending"
    res.json({ message: "Request sent successfully", activeStatus, new_request });

  } catch (error) {
    console.error(error);
    res.json({ message: error.toString() });
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
      .select('memberID boolean')
      .populate({
        path: 'memberID',
        select: '_id username name image',
        options: {
          sort: { createdAt: -1 },
        },
      });

    // Format the response by extracting the member objects
    const formattedMembers = members.map((member) => member.memberID);
    const count = formattedMembers.length;

    res.json({ message: "All Members", count, members: formattedMembers });
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




//********** acceptRequest    ************* */

exports.acceptRequest = async (req, res) => {
  const { rutin_id } = req.params;
  const { username } = req.body;

  try {
    // Find the routine by ID
    const routine = await Routine.findById(rutin_id);
    if (!routine) {
      return res.json({ message: "Routine not found" });
    }

    // Find the member account by username
    const member_ac = await Account.findOne({ username });
    if (!member_ac) {
      return res.json({ message: "Account not found" });
    }

    // Check if the member is already a member of the routine
    const isMember = await RoutineMember.findOne({ memberID: member_ac._id, RutineID: rutin_id });
    if (isMember) {
      return res.json({ message: "User is already a member" });
    }

    const updatedRoutine = await Routine.findOneAndUpdate(
      { _id: rutin_id }, { $addToSet: { members: member_ac._id }, $pull: { send_request: member_ac._id }, },
      { new: true }
    );

    // Create a new RoutineMember object and save it
    const makeMember = new RoutineMember({ memberID: member_ac._id, RutineID: rutin_id });
    await makeMember.save();

    res.json({ message: "Request accepted", routine: updatedRoutine });
  } catch (error) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};

exports.rejectMember = async (req, res) => {
  const { rutin_id } = req.params;
  const { username } = req.body;

  try {
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.json({ message: "Routine not found" });

    const member_ac = await Account.findOne({ username });
    if (!member_ac) return res.json({ message: "Account not found" });


    // Check if user_id is present in the members array
    const isSenRequest = routine.send_request.includes(member_ac._id);
    if (!isSenRequest) return res.json({ message: "User id is not presend into send request array" });


    const updatedRoutine = await Routine.findOneAndUpdate(
      { _id: rutin_id }, { $pull: { send_request: member_ac._id } },
      { new: true }
    );

    res.json({ message: "Member request rejected", routine: updatedRoutine });
  } catch (error) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};

//... leave members....//
exports.leave = async (req, res) => {
  const { rutin_id } = req.params;
  const { username, id } = req.user;
  console.log(rutin_id);

  try {
    const routine = await Routine.findById(rutin_id);
    console.log(routine);
    if (!routine) return res.status(404).json({ message: "Routine not found" });


    const isowener = await RoutineMember.findOne({ memberID: id, RutineID: rutin_id, owner: true });
    if (!isowener) {
      return res.json({ message: "owener can not leave rutine" });
    }


    // Check if the member is already a member of the routine
    const isMember = await RoutineMember.findOne({ memberID: id, RutineID: rutin_id });
    if (!isMember) {
      return res.json({ message: "User is not a member" });
    }
    const leaveMember = await RoutineMember.findOneAndDelete({ memberID: id, RutineID: rutin_id });


    res.json({
      message: "Routine leave successfull", activeStatus: "not_joined",
      routine: leaveMember
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
//... kickout members....//
const mongoose = require('mongoose');
const RoutineMember = require('../models/rutineMembersModel');


exports.kickOut = async (req, res) => {
  const { rutin_id, memberid } = req.params;
  const { id } = req.user;
  console.log(rutin_id);
  console.log(memberid);


  try {
    // Step 1: Find the Routine and check permission
    const routine = await Routine.findById(rutin_id);
    if (!routine) {
      return res.status(404).json({ error: "Routine not found" });
    }

    // Check if the logged-in user is the owner or a captain
    if (req.user.id === routine.ownerid.toString() || routine.cap10s.includes(id)) {
      // Check if the member is in the routine
      if (!mongoose.Types.ObjectId.isValid(memberid)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const isMember = await Routine.findOne({ _id: rutin_id, members: { $in: mongoose.Types.ObjectId(memberid) } });
      if (!isMember) {
        return res.status(400).json({ message: "User already removed" });
      }

      // Remove the member and send a message
      routine.members.pull(memberid);
      routine.notificationOff.pull(memberid);

      const updatedRoutine = await routine.save();

      res.json({ message: "The member is kicked out", updatedRoutine });
    } else {
      return res.json({ message: "Only owners and captains can remove members" });
    }
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
    const isNotificationAllrayOff = await RoutineMember.findOne({ RutineID: rutin_id, memberID: id, notificationOn: true });
    if (isNotificationAllrayOff) {
      return res.json({ message: "Notifications are already turned off", notification_Off: true });
    }

    // Update the notificationOn field to false for the user in the routine
    await RoutineMember.findOneAndUpdate({ RutineID: rutin_id, memberID: id }, { notificationOn: false });

    res.json({ message: "Notifications turned off", notification_Off: true });
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
      return res.json({ message: "Notifications are already turned on", notification_Off: true });
    }

    // Update the notificationOn 
    await RoutineMember.findOneAndUpdate({ RutineID: rutin_id, memberID: id }, { notificationOn: true });

    res.json({ message: "Notifications turned on", notification_Off: true });
  } catch (error) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};
