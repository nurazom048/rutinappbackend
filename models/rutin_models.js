const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rutinshema = new Schema({

  name: {
    type: String,
    required: true,

  },
  image: { type: String },
  ownerid: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },

  last_summary: {
    text: {
      type: String,
      required: true,
      default: "not resent Summay",
    },
    time: {
      type: Date,
      required: true,
      default: Date.now
    },

  },

  class: [{
    type: Schema.Types.ObjectId,
    ref: 'Class'
  }],
  //! Priode
  priode: [
    {

      priode_number: {
        type: Number,
        required: [true, 'Please provide a period number'],
        default: 0,
        validate: {
          validator: function (v) {
            return v > 0;
          },
          message: 'Period number must be greater than zero'
        }
      },
      start_time: {
        type: Date,
        required: [true, 'Start Time is required '],
        // default: Date.now
      },
      end_time: {
        type: Date,
        required: [true, 'end_time is required'],
        //default: Date.now
      }
    }

  ],

  cap10s: [
    {

      cap10Ac: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
      },
      position: {
        type: String,
        default: "cap10",

      },

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
},

  { timestamps: true }


);

const Account = mongoose.model('Routine', rutinshema);

module.exports = Account;