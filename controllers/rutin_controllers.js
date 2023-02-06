const express = require('express')
const app = express()
const Account = require('../models/Account')
const Routine = require('../models/rutin_models')
const Class = require('../models/class_model');






//********** createRutin   ************* */
exports.createRutin =  async (req, res) => {
    const { name } = req.body;
    console.log(req.body)
    console.log(req.user);
    const ownerid = req.user.id;
    
    try {
  


    // Create a new routine

    const routine = new Routine({ name, ownerid });
    const created = await routine.save();

    const user = await Account.findOneAndUpdate({ _id: ownerid }, {$push: {routines: created._id}}, {new : true});

    // Send response
    res.status(200).json({ message: "Routine created successfully", created,user });
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating routine" });
    }
    }




    
//*******      delete   ***** */


 exports.delete = async (req, res) => {
   const { id } = req.params;
   const routine = await Routine.findById(id);

   try {
   
   if (!routine) 
   return res.status(404).json({ message: "Routine not found" });
   
   // Check if the routine owner ID matches the requesting user ID
   if (routine.ownerid.toString() !== req.user.id) 
   return res.status(401).json({ message: "Unauthorized to delete routine" });
   
   // Delete the routine
   await Routine.findByIdAndRemove(id);
   // Send response
   res.status(200).json({ message: "Routine deleted successfully" });

   
   } catch (error) {
   console.error(error);
   res.status(500).json({ message: "Error deleting routine" });
   }
   }



   

//********** alL RUTIN   ************* */
exports.allRutin = async (req, res) => {
  console.log(req.user);
  const userid = req.user.id;

  try {
    const user = await Account.findOne({ _id: userid }).populate({ 
      path: 'routines', 
      select: 'name ownerid class',
      options: {
        sort: { createdAt: -1 } // -1 for descending, 1 for ascending
        },
      populate: {
        path: 'ownerid',
       // model: 'name'
       select: 'name username',
      }
    });
    if (!user) return res.status(404).json({ message: "User not found" });


    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting routines" });
  }
};
