const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,

  },
  image: {
    type: String
  },
  Saved_routines: [{
    type: Schema.Types.ObjectId,
    ref: 'Routine'
  }],

  password: {
    type: String,
    required: true
  },
  account_type: {
    type: String,
    enum: ['user', 'academy'],
    required: true,
    default: 'user'
  },

  routines: [{
    type: Schema.Types.ObjectId,
    ref: 'Routine'
  }]
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
