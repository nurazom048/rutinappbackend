const mongoose = require('mongoose');


const Schema = mongoose.Schema;

// Define weekday schema
const weekdaySchema = new mongoose.Schema({
  routine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Routine',

  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },
  num: {
    type: Number,
    required: [true, 'Weekday number is required'],
    enum: [0, 1, 2, 3, 4, 5, 6]
  },
  start: {
    type: Number,
    required: [true, 'Start period is required'],
    validate: {
      validator: function (value) {
        return value <= this.end && value !== 0;
      },
      message: 'Start period should be less than End period and cannot be zero'
    }
  },
  end: {
    type: Number,
    required: [true, 'End period is required'],
    validate: {
      validator: function (value) {
        return value !== 0;
      },
      message: 'End period cannot be zero'
    }
  }
});

// Create weekday model from schema
const Weekday = mongoose.model('Weekday', weekdaySchema);

// Export weekday model
module.exports = Weekday;