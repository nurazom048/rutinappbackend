const Routine = require('../models/rutin_models');
const Class = require('../models/class_model');

exports.add_priode = async (req, res) => {
  const { rutin_id } = req.params;
  const { start_time, end_time } = req.body;

  try {

 

    // Find the routine the class belongs to
    const routine = await Routine.findOne({ _id: rutin_id });

    
    // Add the new period to the routine
  routine.priode.push({ start_time, end_time });

    // Save the changes to the routine
    const   aded =   await routine.save();

res.status(200).send({message:'Period added to routine',aded});
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
}




//************ all priode *************** */
exports.all_priode = async (req, res) => {
    const { rutin_id } = req.params;
    
    console.log(rutin_id);
  
    try {
        const routine = await Routine.findOne({ _id: rutin_id });
        //console.log(routine);
    
      if (!routine) return res.status(404).send('Routine not found');

   
      const priode = await Routine.find({ _id: rutin_id }).select('-_id priode');

      
      console.log(priode);
      res.send(priode[0]);
      
    } catch (error) {
        
      res.status(400).send({ error });
    }
  };