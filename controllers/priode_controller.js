const Routine = require('../models/rutin_models');
const Class = require('../models/class_model');
const { handleValidationError } = require('../methode/validation_error');

const Priode = require('../models/priodeModels');


//************  add Priode *************** */




exports.add_priode = async (req, res) => {
  const { start_time, end_time, priode_number } = req.body;
  const { rutin_id } = req.params;

  try {
    // Check if the routine exists
    const existingRoutine = await Routine.findOne({ _id: rutin_id });
    if (!existingRoutine) return res.status(404).send({ message: 'Routine not found' });

    const exsisPriod = await Priode.findOne({ rutin_id: rutin_id, priode_number: priode_number });
    if (exsisPriod) return res.status(404).send({ message: 'this priod allray exsist not found' });


    // Create a new priode instance
    const priode = new Priode({
      start_time,
      end_time,
      priode_number,
      rutin_id,
    });

    // Save the priode to the database
    const added = await priode.save();

    res.status(200).send({ message: 'Priode added to routine', added });
  } catch (error) {
    if (!handleValidationError(res, error)) {
      return res.status(500).send({ message: error.message });
    }
  }
};

//************  eddit priode ***************** */

exports.edit_priode = async (req, res) => {
  const { start_time, end_time, priode_number } = req.body;
  const { rutin_id } = req.params;

  try {
    // Check if the routine exists
    const existingRoutine = await Routine.findOne({ _id: rutin_id });
    if (!existingRoutine) return res.status(404).send({ message: 'Routine not found' });

    // Find the priode to update
    const priodeToUpdate = await Priode.findOne({ rutin_id, priode_number });
    if (!priodeToUpdate) return res.status(404).send({ message: 'Priode not found' });

    // Update the priode properties
    priodeToUpdate.start_time = start_time;
    priodeToUpdate.end_time = end_time;

    // Save the updated priode to the database
    const updated = await priodeToUpdate.save();

    res.status(200).send({ message: 'Priode updated', updated });
  } catch (error) {
    if (!handleValidationError(res, error)) {
      return res.status(500).send({ message: error.message });
    }
  }
};



//************  Delete Priode *************** */

exports.delete_priode = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPriode = await Priode.findByIdAndRemove(id);
    if (!deletedPriode) return res.status(404).json({ message: "Priode not found" });


    res.json({ message: "Priode deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
;





//************ all priode  *************** */
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