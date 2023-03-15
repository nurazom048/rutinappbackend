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
      routine.members.push( members_ac._id );
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



  //**********  sendMemberRequest   ************* */
  exports.sendMemberRequest = async (req, res) => {
    const { rutin_id } = req.params;
    const { username } = req.user;
  
    try {
      // Check if the member's account exists
      const member_ac = await Account.findOne({ username });
      if (!member_ac) return res.json({ message: "Account not found" });
  
      // Find the routine to remove the member from
      const routine = await Routine.findOne({ _id: rutin_id });
      if (!routine) return res.json({ message: "Routine not found" });
  
      // Check if the member is already added
      const allradySend = routine.send_request.includes(member_ac._id.toString());
      if (allradySend) return res.json({ message: "request allrady sended" });
  
  // Add the member to send request
  routine.send_request.push( member_ac._id );
  const new_request = await routine.save();
  res.json({ message: "requestsend  successfully", new_request });
  
    } catch (error) {
      console.error(error);
      res.json({ message: error.toString() });
    }
  };