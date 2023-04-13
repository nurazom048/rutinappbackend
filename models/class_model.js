const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const classscheme = new Schema({
    name: {
        type: String,
        required: [true, 'Rutin Nane is required']
    },
    instuctor_name: {
        type: String,
        required: [true, 'instuctor_name is required'],
        default: ""
    },
    room: {
        type: String,
        required: [true, 'room is required'],
        default: ""

    },

    subjectcode: {
        type: String,
        required: [true, 'subjectcode is required'],
        default: ""

    },


    weekday: [{
        type: Schema.Types.ObjectId,
        ref: 'Weekday'
    }],

    rutin_id: {
        type: Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
    },
    summary: [

        {
            text: {
                type: String,
                required: [true, 'Summary Text is required']
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




