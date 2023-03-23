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

    // Add the member to the routine
    routine.members.push(members_ac._id);
    const new_member = await routine.save();
    res.json({ message: "Member added successfully", new_member });

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
    const alreadyAdded = routine.members.includes(member_ac._id.toString());
    if (!alreadyAdded) return res.json({ message: "Member not found in routine" });

    // Remove the member from the routine
    routine.members = routine.members.filter((member) => member.toString() !== member_ac._id.toString());
    const updated_routine = await routine.save();
    res.json({ message: "Member removed successfully", updated_routine });

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

  try {
    // Find the routine and its members 
    const routine = await Routine.findOne({ _id: rutin_id }, { members: 1 })
      .populate({
        path: 'members',
        select: 'name username image',
        options: {
          sort: { createdAt: -1 },
        },
      });
    if (!routine) return res.json({ message: "Routine not found" });

    const members = routine.members;
    const count = members.length;

    res.json({ message: "All Members", count, members });

  } catch (error) {
    console.error(error);
    res.json({ message: error.toString() });
  }
};


//**********  see all member in rutin    ************* */
exports.allRequest = async (req, res) => {
  const { rutin_id } = req.params;

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
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.json({ message: "Routine not found" });

    const member_ac = await Account.findOne({ username });
    if (!member_ac) return res.json({ message: "Account not found" });



    // Check if user_id is already in the members array
    const isMember = routine.members.includes(member_ac._id);
    if (isMember) return res.json({ message: "User is already a member" });


    // Check if user_id is present in the send_request array
    // const isRequestSent = routine.send_request.includes(user_id);
    // if (!isRequestSent) return res.json({ message: "User not found in send_request" });


    const updatedRoutine = await Routine.findOneAndUpdate(
      { _id: rutin_id }, { $addToSet: { members: member_ac._id }, $pull: { send_request: member_ac._id }, },
      { new: true }
    );

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
    if (!routine) return res.status(404).json({ error: "Routine not found" });



    const isMember = routine.members.includes(id);
    if (!isMember) return res.status(400).json({ error: "User id is not present in the send request array" });


    const updatedRoutine = await Routine.findOneAndUpdate(
      { _id: rutin_id },
      { $pull: { members: id } },
      { new: true }
    ).exec();

    res.json({
      message: "Routine leave successfull", activeStatus: "not_joined",

      routine: updatedRoutine
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
