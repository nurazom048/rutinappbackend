const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const classscheme = new Schema({
    name: {
    type: String,
    required: true
    },
    room: {
    type: String,
   
    },
    
    subjectcode: {
    type: String,
   
    },

    start: {
    type: Number,
    required: true
    },
    end: {
    type: Number,
    required: true
    },
    weekday: {
    type: Number,
    enum: [1, 2, 3, 4, 5, 6, 7],
    required: true
    },
    start_time: {
    type: Date,
    required: true
    },
    end_time: {
    type: Date,
    required: true
    },
    rutin_id: {
        type: Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
        },

    });
    
    const classs = mongoose.model('Class', classscheme);
    
    module.exports = classs;
    
    
    
    
