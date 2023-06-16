const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const routineMemberSchema = new mongoose.Schema({
    memberID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        require: true
    },

    RutineID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Routine',
        default: null,

    },
    notificationOn: {
        type: Boolean,
        default: false,
    },
    captain: {
        type: Boolean,
        default: false,
    },
    owner: {
        type: Boolean,
        default: false,
    },
    blocklist: {
        type: Boolean,
        default: false,
    },
});

const RoutineMember = mongoose.model('RoutineMember', routineMemberSchema);

module.exports = RoutineMember;
