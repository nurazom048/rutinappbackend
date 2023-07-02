const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pendingAccount = new Schema({

  isAccept: {
    type: Boolean,
    default: false,

  },

  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  EIIN: {
    type: String,
    required: true,
    unique: true
  },
  adddress: {
    type: String,

  },


  name: {
    type: String,

  },

  about: {
    type: String,


  },

  contractInfo: {
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
  sendTime: {
    type: Date,
    required: true,
    default: Date.now
  },
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


});

const Account = mongoose.model('PendingAccount', pendingAccount);

module.exports = Account;
