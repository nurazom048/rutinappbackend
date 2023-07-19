const mongoose = require('mongoose');

const DeletedClassSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const DeletedClass = mongoose.model('DeletedClass', DeletedClassSchema);

module.exports = DeletedClass;
