const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const classscheme = new Schema({
    name: {
    type: String,
    required: true
    },
   instuctor_name: {
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
    has_class: {
        type: String,
        enum: ["has_class", "no_class"],
        required: true,
        default : "has_class"
        },
    rutin_id: {
        type: Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
        },
    summary: [
        
{
    text: {
        type: String,
        required: true
          },
          time: {
            type: Date,
            required: true,
            default: Date.now
        }
        
}, 
             
        
            
            
            ] 
    });
    
    const classs = mongoose.model('Class', classscheme);
    
    module.exports = classs;
    
    
    
    
