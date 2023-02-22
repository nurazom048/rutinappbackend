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

last_summary:{

  
    text: {
        type: String,
        required: true,
        default:"not resent Summay",

          },
    time: {
            type: Date,
            required: true,
            default: Date.now
        },
       
},

class:[{
    type: Schema.Types.ObjectId,
    ref: 'Class'
  }],

  priode:[


{
  start_time:{
    type: Date,
  required: true,
  default: Date.now
  },
  end_time:{
    type: Date,
  required: true,
  default: Date.now
  }
  
}

  ]

  

},

  { timestamps: true }


);

const Account = mongoose.model('Routine', rutinshema);

module.exports = Account;
