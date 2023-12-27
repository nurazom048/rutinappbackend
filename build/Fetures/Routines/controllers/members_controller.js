"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notification_On = exports.notification_Off = exports.kickOut = exports.leave = exports.rejectMember = exports.acceptRequest = exports.allRequest = exports.allMembers = exports.sendMemberRequest = exports.removeMember = exports.addMember = void 0;
// Models
const Account_Model_1 = __importDefault(require("../../Account/models/Account.Model"));
const routine_models_1 = __importDefault(require("../models/routine.models"));
const routineMembers_Model_1 = __importDefault(require("../models/routineMembers.Model"));
//**********  addMembers   ************* */
const addMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID, username } = req.params;
    try {
        // Check if the member's account exists
        const members_ac = yield Account_Model_1.default.findOne({ username });
        if (!members_ac)
            return res.json({ message: "Account not found" });
        // Find the routine to add the member to
        const routine = yield routine_models_1.default.findOne({ _id: routineID });
        if (!routine)
            return res.json({ message: "Routine not found" });
        // Check if the member is already added
        const alreadyAdded = routine.members.includes(members_ac._id.toString());
        if (alreadyAdded)
            return res.json({ message: "Member already added" });
        //add member
        const addMember = new routineMembers_Model_1.default({ memberID: members_ac._id }); // Create a new RoutineMember instance
        yield addMember.save(); // Wait for the routineMember instance to be saved
        // Add the member to the routine
        routine.members.push(members_ac._id);
        const new_member = yield routine.save();
        res.json({ message: "Member added successfully", addMember, new_member });
        //
    }
    catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
});
exports.addMember = addMember;
//**********  removeMember   ************* */
const removeMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID, username } = req.params;
    try {
        // Check if the member's account exists
        const member_ac = yield Account_Model_1.default.findOne({ username });
        if (!member_ac)
            return res.json({ message: "Account not found" });
        // Find the routine to remove the member from
        const routine = yield routine_models_1.default.findOne({ _id: routineID });
        if (!routine)
            return res.json({ message: "Routine not found" });
        // Check if the member is already added
        const ifMemberFound = yield routineMembers_Model_1.default.findOne({ memberID: member_ac._id, RutineID: routine });
        if (!ifMemberFound)
            return res.json({ message: "Member Already removed" });
        const removeMember = routineMembers_Model_1.default.findByIdAndRemove(ifMemberFound._id);
        // // Remove the member from the routine
        // routine.members = routine.members.filter((member) => member.toString() !== member_ac._id.toString());
        // const updated_routine = await routine.save();
        res.json({ message: "Member removed successfully", removeMember });
    }
    catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
});
exports.removeMember = removeMember;
//***********  sendMemberRequest *************/
const sendMemberRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID } = req.params;
    const { username } = req.user;
    let activeStatus = "not_joined";
    try {
        // Check if the member's account exists
        const member_ac = yield Account_Model_1.default.findOne({ username });
        if (!member_ac) {
            return res.status(404).json({ message: "Account not found" });
        }
        // Find the routine to remove the member from
        const routine = yield routine_models_1.default.findOne({ _id: routineID });
        if (!routine) {
            return res.status(404).json({ message: "Routine not found" });
        }
        // Check if the member is already a part of the routine
        const isMember = yield routineMembers_Model_1.default.findOne({ RutineID: routineID, memberID: member_ac.id });
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
        const new_request = yield routine.save();
        activeStatus = "request_pending";
        res.status(200).json({ message: "Request sent successfully", activeStatus });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.toString() });
    }
});
exports.sendMemberRequest = sendMemberRequest;
//******* All Members in the  Routine  ***************/
const allMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID } = req.params;
    const { page = 1, limit = 10 } = req.query;
    try {
        // Find the routine and its members
        const routine = yield routine_models_1.default.findOne({ _id: routineID }, { members: 1 });
        if (!routine) {
            return res.json({ message: "Routine not found" });
        }
        // Count the total number of members
        const count = yield routineMembers_Model_1.default.countDocuments({ RutineID: routineID });
        // Calculate the total number of pages
        const totalPages = Math.ceil(count / limit);
        // Find the members and populate the memberID field with pagination
        const members = yield routineMembers_Model_1.default.find({ RutineID: routineID })
            .select('-__v -blocklist -_id')
            .populate({
            path: 'memberID',
            model: Account_Model_1.default,
            select: '_id username name image',
            options: {
                skip: (page - 1) * limit,
                limit: parseInt(limit),
                sort: { createdAt: -1 },
            },
        });
        // Format the response by extracting the member objects
        const formattedMembers = members
            .map(({ memberID, notificationOn, captain, owner }) => {
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
            .filter((member) => member !== null);
        res.json({
            message: "All Members",
            currentPage: parseInt(page),
            totalPages,
            totalCount: count || 1,
            members: formattedMembers,
        });
    }
    catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
});
exports.allMembers = allMembers;
//**********  see all member in rutin    ************* */
const allRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID } = req.params;
    // console.log(routineID);
    try {
        // Find the routine and  member 
        const routine = yield routine_models_1.default.findOne({ _id: routineID }, { send_request: 1 })
            .populate({
            path: 'send_request',
            model: Account_Model_1.default,
            select: 'name username image',
            options: {
                sort: { createdAt: -1 },
            },
        });
        if (!routine)
            return res.json({ message: "Routine not found" });
        const count = routine.send_request.length;
        res.json({ message: "all new request ", count, allRequest: routine.send_request });
    }
    catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
});
exports.allRequest = allRequest;
const acceptRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID } = req.params;
    const { username, acceptAll } = req.body;
    try {
        // Find the routine by ID
        const routine = yield routine_models_1.default.findById(routineID);
        if (!routine) {
            return res.status(404).json({ message: "Routine not found" });
        }
        console.log(acceptAll);
        if (acceptAll === 'true') {
            // Accept all the requests in this routine
            for (let i = 0; i < routine.send_request.length; i++) {
                const memberId = routine.send_request[i];
                // Check if the member is already a member of the routine
                const isMember = yield routineMembers_Model_1.default.findOne({ memberID: memberId, RutineID: routineID });
                if (!isMember) {
                    // Remove the member from send_request array
                    // routine.send_request.pull(memberId);
                    yield routine_models_1.default.findOneAndUpdate({ _id: routineID }, { $pull: { send_request: memberId } });
                    // Create a new RoutineMember object and save it
                    const makeMember = new routineMembers_Model_1.default({ memberID: memberId, RutineID: routineID });
                    yield makeMember.save();
                }
            }
            // Save the updated routine
            yield routine.save();
            return res.json({ message: "All requests accepted" });
        }
        // Find the member account by username
        const member_ac = yield Account_Model_1.default.findOne({ username });
        if (!member_ac) {
            return res.status(404).json({ message: "Account not found" });
        }
        // Check if the member is already a member of the routine
        const isMember = yield routineMembers_Model_1.default.findOne({ memberID: member_ac._id, RutineID: routineID });
        if (isMember) {
            return res.status(400).json({ message: "User is already a member" });
        }
        const updatedRoutine = yield routine_models_1.default.findOneAndUpdate({ _id: routineID }, { $addToSet: { members: member_ac._id }, $pull: { send_request: member_ac._id } }, { new: true });
        // Create a new RoutineMember object and save it
        const makeMember = new routineMembers_Model_1.default({ memberID: member_ac._id, RutineID: routineID });
        yield makeMember.save();
        res.json({ message: "Request accepted" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.toString() });
    }
});
exports.acceptRequest = acceptRequest;
//*********** rejectMember *********************/
const rejectMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID } = req.params;
    const { username } = req.body;
    try {
        const routine = yield routine_models_1.default.findById(routineID);
        if (!routine) {
            return res.status(404).json({ message: "Routine not found" });
        }
        const member_ac = yield Account_Model_1.default.findOne({ username });
        if (!member_ac) {
            return res.status(404).json({ message: "Account not found" });
        }
        // Check if user_id is present in the send_request array
        const isSendRequest = routine.send_request.includes(member_ac._id);
        if (!isSendRequest) {
            return res.status(404).json({ message: "User id is not present in the send request array" });
        }
        const updatedRoutine = yield routine_models_1.default.findOneAndUpdate({ _id: routineID }, { $pull: { send_request: member_ac._id } }, { new: true });
        res.status(200).json({ message: "Member request is rejected ", routine: updatedRoutine });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.toString() });
    }
});
exports.rejectMember = rejectMember;
//********************  leave members  *****************//
const leave = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID } = req.params;
    const { id } = req.user;
    // console.log(routineID);
    try {
        // Step 1: Find the Routine
        const routine = yield routine_models_1.default.findById(routineID);
        if (!routine) {
            return res.status(404).json({ message: "Routine not found" });
        }
        // Step 2: Check if the user is a member and not the owner
        const member = yield routineMembers_Model_1.default.findOne({ memberID: id, RutineID: routineID });
        if (!member) {
            return res.status(404).json({ message: "User is not a member" });
        }
        if (member.owner) {
            return res.status(403).json({ message: "Owners cannot leave the routine" });
        }
        // Step 3: Remove the member and send a success message
        const leaveMember = yield routineMembers_Model_1.default.findOneAndDelete({ memberID: id, RutineID: routineID });
        res.json({
            message: "Routine leave successful",
            activeStatus: "not_joined",
            routine: leaveMember
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});
exports.leave = leave;
//*****************   kickOut  ************************ */
const kickOut = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID, memberID } = req.params;
    const { id } = req.user;
    // console.log(routineID);
    // console.log(memberID);
    try {
        // Step 1: Find the Routine and check permission
        const routine = yield routine_models_1.default.findById(routineID);
        if (!routine)
            return res.status(404).json({ message: "Routine not found" });
        // Check if the logged-in user is the owner or a captain
        const isHavePermission = yield routineMembers_Model_1.default.findOne({ RutineID: routine.id, memberID: req.user.id });
        if (!isHavePermission || (isHavePermission.owner === false && isHavePermission.captain === false)) {
            return res.json({ message: "Only the captain and owner can modify" });
        }
        // Check if the member is in the routine and not the owner
        const isMember = yield routineMembers_Model_1.default.findOne({ RutineID: routine.id, memberID: routineID });
        if (!isMember)
            return res.status(400).json({ message: "User already removed" });
        if (isMember.owner === true)
            return res.status(400).json({ message: "No one can kick the owner" });
        // Remove the member and send a message
        yield routineMembers_Model_1.default.findByIdAndDelete(isMember._id);
        res.json({ message: "The member is kicked out" });
    }
    catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
});
exports.kickOut = kickOut;
// notification off
const notification_Off = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID } = req.params;
    const { id } = req.user;
    try {
        // Find the routine by ID
        const routine = yield routine_models_1.default.findById(routineID);
        if (!routine) {
            return res.json({ message: "Routine not found" });
        }
        // Check if the user is a member of this routine
        const isMember = yield routineMembers_Model_1.default.findOne({ RutineID: routineID, memberID: id });
        if (!isMember) {
            return res.json({ message: "You are not a member of this routine" });
        }
        // Check if the user has already turned on notifications
        const isNotificationAllrayOff = yield routineMembers_Model_1.default.findOne({ RutineID: routineID, memberID: id, notificationOn: false });
        if (isNotificationAllrayOff) {
            return res.json({ message: "Notifications are already turned off", notificationOn: false });
        }
        // Update the notificationOn field to false for the user in the routine
        yield routineMembers_Model_1.default.findOneAndUpdate({ RutineID: routineID, memberID: id }, { notificationOn: false });
        res.json({ message: "Notifications turned off", notificationOn: false });
    }
    catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
});
exports.notification_Off = notification_Off;
// notification on
const notification_On = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { routineID } = req.params;
    const { id } = req.user;
    try {
        // Find the routine by ID
        const routine = yield routine_models_1.default.findById(routineID);
        if (!routine) {
            return res.json({ message: "Routine not found" });
        }
        // Check if the user is a member of this routine
        const isMember = yield routineMembers_Model_1.default.findOne({ RutineID: routineID, memberID: id });
        if (!isMember) {
            return res.json({ message: "You are not a member of this routine" });
        }
        // Check if the user has already turned off notifications
        const isNotificationOAlreadyOn = yield routineMembers_Model_1.default.findOne({ RutineID: routineID, memberID: id, notificationOn: true });
        if (isNotificationOAlreadyOn) {
            return res.json({ message: "Notifications are already turned on", notificationOn: true });
        }
        // Update the notificationOn 
        isMember.notificationOn = true;
        isMember.save();
        res.json({ message: "Notifications turned on", notificationOn: true });
    }
    catch (error) {
        console.error(error);
        res.json({ message: error.toString() });
    }
});
exports.notification_On = notification_On;
