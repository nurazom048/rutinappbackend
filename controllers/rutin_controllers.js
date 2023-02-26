const express = require('express')
const app = express()
const Account = require('../models/Account')
const Routine = require('../models/rutin_models')
const Class = require('../models/class_model');
const { checkout } = require('../routes/class_route');
const { async } = require('@firebase/util');






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



exports.allRutin = async (req, res) => {
  console.log(req.user);
  const {accountID}= req.params;
   const  userid  = req.user.id ;

  try {
    const pramsAC = await Account.findOne({ _id:accountID });

    const user = await Account.findOne({ _id: userid}).populate([
      {
        path: 'routines',
        select: 'name ownerid class priode last_summary',
        options: {
          sort: { createdAt: -1 }
        },
   
        populate: {
          path: 'ownerid',
          select: 'name username image'
        }
      },
      {
        path: 'Saved_routines',
        select: 'name ownerid class',
        options: {
          sort: { createdAt: -1 }
        },
        populate: {
          path: 'ownerid',
          select: 'name username image'
        }
      }
    ]);
    if (!user) return res.status(404).json({ message: "User not found" });
   

  
      res.status(200).json({ user , });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error getting routines" });
    }
  };
  

//********** save rutin   ************* */
exports.save_routine = async (req, res) => {
  const { rutin_id } = req.params;
  const ownerid = req.user.id;
  
  try {
  // 1. Find the routine
  const routine = await Routine.findById(rutin_id);
  if (!routine) return res.status(404).json({ message: "Routine not found" });
  
 
  // 2. Find the user
  const user = await Account.findById(ownerid);
  if (!user) return res.status(404).json({ message: "User not found" });
  
  // 3. Check if routine is already saved
  if (user.Saved_routines.includes(routine._id)) {
    return res.status(200).json({ message: "Routine already saved", save: true });
  }
  
  // 4. Push the routine ID into the saved_routines array
  user.Saved_routines.push(routine._id);
  await user.save();
  
  // Send response
  res.status(200).json({ message: "Routine saved successfully", save: true });
  } catch (error) {
  console.error(error);
  res.status(500).json({ message: "Error saving routine" });
  }
  };









  //.... unsave rutin 
  exports.unsave_routine = async (req, res) => {
    const { rutin_id } = req.params;
    const ownerid = req.user.id;
    
    try {
    // 1. Find the routine
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });
    

    // 2. Find the user
    const user = await Account.findById(ownerid);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // 3. Check if routine is already saved
    if (!user.Saved_routines.includes(routine._id)) {
      return res.status(400).json({ message: "Routine not saved" });
    }
    
    // 4. Remove the routine ID from the saved_routines array
    user.Saved_routines.pull(routine._id);
    await user.save();
    
    // Send response
    res.status(200).json({ message: "Routine unsaved successfully", save: false });
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error unsaving routine" });
    }
    };


    ///.... chack save or not
    exports.save_checkout = async (req, res) => {
      const { rutin_id } = req.params;
      const ownerid = req.user.id;
      
      try {
      // 1. Find the routine
      const routine = await Routine.findById(rutin_id);
      if (!routine) return res.status(404).json({ message: "Routine not found" });
      
     
      // 2. Find the user
      const user = await Account.findOne({ownerid});
      if (!user) return res.status(404).json({ message: "User not found" });
      
      // 3. Check if routine is already saved
      let isSaved;
       isOwner = false;
      if (user.Saved_routines.includes(routine._id)) {
        isSaved = true;
      }

      if (!user.Saved_routines.includes(routine._id)) {
        isSaved = false;

      }

    // chack is owner is not
      if (routine.ownerid.toString() == req.user.id) 
       { isOwner = true; };

   
     
      
      // Send response
      res.status(200).json({ message: "Routine saved conditon", save: isSaved ,isOwner , user  });
      } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error saving routine" });
      }
      };







  //.....   Search rutins   .....///

exports.search_rutins = async (req,res)=> {
  const {src}= req.params;
              
try {



  const rutins = await Routine.find({ name: { $regex: src, $options: "i" } })
  .select("-createdAt -class -updatedAt -priode -__v")
  .populate({
    path: "ownerid",
    select: "_id name username image"
  }); 
 
  if(!rutins) return res.send({message:"not Found",});
  
  res.send({message:" Found", rutins})

  
} catch (error) {
  
}

}