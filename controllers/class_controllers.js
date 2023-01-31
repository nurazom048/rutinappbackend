










 const express = require('express')
 const app = express()
 const Account = require('../models/Account')
 const Routine = require('../models/rutin_models')
 const Class = require('../models/class_model');
 var jwt = require('jsonwebtoken');
 
 
 
 
 
 
 
 
 
 

 exports.create_class =  async (req, res) => {
    const { rutin_id } = req.params;
    const { name,room,subjectcode, start, end,weekday,start_time,end_time } = req.body;
    console.log(req.user);
  
  
    const rutin = await Routine.findOne( {_id : rutin_id});
   console.log(rutin.ownerid.toString());
  
    if (!rutin) return res.status(404).send('Routine not found');
    if (rutin.ownerid.toString() !== req.user.id)
      return res.status(401).send('You can only add classes to your own routine');
  
    const newClass = new Class({
      name, room,subjectcode,start,end,weekday, start_time,end_time});
  
      await newClass.save();
      rutin.class.push(newClass._id);
      await rutin.save();
      res.send({ class: newClass, message: 'Class added successfully' });
  }
  
  