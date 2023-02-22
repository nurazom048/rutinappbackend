const express = require('express')
const app = express()
const Account = require('../models/Account')
const Routine = require('../models/rutin_models')
const Class = require('../models/class_model');
const { async } = require('@firebase/util');
const { findOne } = require('../models/rutin_models');




  //************   creat summary        *************** */
  
  exports.create_summary  =  async (req, res) => {
    const { class_id } = req.params;
    const { text } = req.body;

 
 try {

   //... find rutin by class and chack permision
   const classInstance = await Class.findOne({ _id: class_id });
   if (!classInstance) return res.status(404).send('Class not found');
   //
   const find_rutin = await Routine.findOne({ _id: classInstance.rutin_id });
   if (!find_rutin) return res.status(404).jsom({message:'Class not found'});
   if (req.user.id.toString() !== find_rutin.ownerid.toString())
     return res.status(401).json({message:'You do not have permission to add a summary'});


     //.. push the summary and send responce 
   classInstance.summary.push({ text });
   await classInstance.save();

   //.. also push to rutin last summay onject ...//
  const last_summary = await   Routine.findOneAndUpdate({_id:find_rutin._id },{last_summary:{text:text}},{new:true})
   return res.status(200).send({classInstance,last_summary});

   //
 } catch (error) {
   return res.status(400).send(error.message);
 }
};


//************ remove summary *************** */

exports.remove_summary = async (req, res) => {
  const {summary_id } = req.params;
  
  try {
// find the class that contains the summary
const classInstance = await Class.findOne({ 'summary._id': summary_id });
if (!classInstance) return res.status(404).json({message: 'Summary not found'});

// find the routine that contains the class and check if the current user has permission to edit
const routineInstance = await Routine.findOne({ _id: classInstance.rutin_id });
if (!routineInstance) return res.status(404).json({message: 'Routine not found'});
if (req.user.id.toString() !== routineInstance.ownerid.toString())
return res.status(401).json({message: 'You do not have permission to edit a summary'});

   
  //.. remove the summary and send response
  classInstance.summary.pull({ _id: summary_id });
  await classInstance.save();
  return res.status(200).send(classInstance);
  ///
  } catch (error) {
  return res.status(400).send(error.message);
  }
  };


  //************ Get class summary list *************** */

exports.get_class_summary_list = async (req, res) => {
  const { class_id } = req.params;
  
  try {
  //... find class
  const classInstance = await Class.findOne({ _id: class_id });
  if (!classInstance) return res.status(404).json({message: 'Class not found'});
  
  //.. send response with summary list
  return res.status(200).json({ summaries: classInstance.summary });
  
  } catch (error) {
  return res.status(400).send(error.message);
  }
  };

    //************ update  summary list *************** */



exports.update_summary = async (req, res) => {
const { summary_id } = req.params;

try {
// find the class that contains the summary
const classInstance = await Class.findOne({ 'summary._id': summary_id });
if (!classInstance) return res.status(404).json({message: 'Summary not found'});

// find the routine that contains the class and check if the current user has permission to edit
const routineInstance = await Routine.findOne({ _id: classInstance.rutin_id });
if (!routineInstance) return res.status(404).json({message: 'Routine not found'});
if (req.user.id.toString() !== routineInstance.ownerid.toString())
return res.status(401).json({message: 'You do not have permission to edit a summary'});

// update the summary and send response
const summary = classInstance.summary.id(summary_id);
summary.text = req.body.text;
await classInstance.save();
return res.status(200).send(classInstance);
} catch (error) {
return res.status(400).send(error.message);
}
};


//.... get last updated summay....//
exports.get_last_updated_summary = async (req,res) => {


try {




  
} catch (error) {
  
}



}