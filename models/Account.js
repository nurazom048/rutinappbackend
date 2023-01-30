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

  password: {
    type: String,
    required: true
  },
  routines: [{
    type: Schema.Types.ObjectId,
    ref: 'Routine'
  }]
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
