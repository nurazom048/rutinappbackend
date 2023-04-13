const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const priodModelSchema = new Schema({
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

    },
    end_time: {
        type: Date,
        required: [true, 'end_time is required'],

    },
    rutin_id: {
        type: Schema.Types.ObjectId,
        ref: 'Routine',
        required: true,
    },
});

const priodModel = mongoose.model('priodModel', priodModelSchema);

module.exports = priodModel;
