const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rutinshema = new Schema({

  name: {
    type: String,
    required: true,

  },

  ownerid: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },



  class: [{
    type: Schema.Types.ObjectId,
    ref: 'Class'
  }],



  cap10s: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    }
  ],

  send_request: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    }
  ],
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    }
  ],

  notificationOff: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    }
  ],
},

  { timestamps: true }


);

const Account = mongoose.model('Routine', rutinshema);

module.exports = Account;

///