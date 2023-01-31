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



class:[   {
    type: Schema.Types.ObjectId,
    ref: 'Class'
  }     ],

  

});

const Account = mongoose.model('Routine', rutinshema);

module.exports = Account;
