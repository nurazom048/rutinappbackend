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


  },

  about: {
    type: String,


  },
  email: {
    type: String,

  },
  phone: {
    type: String,

  },
  image: {
    type: String
  },
  coverImage: {
    type: String
  },
  Saved_routines: [{
    type: Schema.Types.ObjectId,
    ref: 'Routine'
  }],

  password: {
    type: String
  },

  osUserID: {
    type: String,
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
  }],


  googleSignIn: {
    type: Boolean,
    require: true,
    default: false,
  }


});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
