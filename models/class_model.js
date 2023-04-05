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
    },

    weekday: {
        type: Number,
        required: [true, 'Weekday is required'],
        enum: [1, 2, 3, 4, 5, 6, 7],

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




