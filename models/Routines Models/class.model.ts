import mongoose, { Document, Schema, Model } from 'mongoose';

interface IClass extends Document {
  name: string;
  instuctor_name: string;
  subjectcode: string;
  weekday: mongoose.Types.ObjectId[];
  rutin_id: mongoose.Types.ObjectId;
}

const classScheme: Schema<IClass> = new Schema<IClass>({
  name: {
    type: String,
    required: [true, 'Routine Name is required'],
  },
  instuctor_name: {
    type: String,
    required: [true, 'instuctor_name is required'],
    default: '',
  },
  subjectcode: {
    type: String,
    required: [true, 'subjectcode is required'],
    default: '',
  },
  weekday: [{
    type: Schema.Types.ObjectId,
    ref: 'Weekday',
    required: true,
  }],
  rutin_id: {
    type: Schema.Types.ObjectId,
    ref: 'Routine',
    required: true,
  },
});

const Class: Model<IClass> = mongoose.model<IClass>('Class', classScheme);

export default Class;












// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;


// const classscheme = new Schema({
//     name: {
//         type: String,
//         required: [true, 'Rutin Nane is required']
//     },
//     instuctor_name: {
//         type: String,
//         required: [true, 'instuctor_name is required'],
//         default: ""
//     },
  

//     subjectcode: {
//         type: String,
//         required: [true, 'subjectcode is required'],
//         default: ""

//     },


//     weekday: [{
//         type: Schema.Types.ObjectId,
//         ref: 'Weekday',
//         require: true,
//     }],

//     rutin_id: {
//         type: Schema.Types.ObjectId,
//         ref: 'Routine',
//         required: true,
//     },

// });

// const classs = mongoose.model('Class', classscheme);

// module.exports = classs;




