const Routine = require('../models/rutin_models');
const Class = require('../models/class_model');
const { handleValidationError } = require('../methode/validation_error');

const Priode = require('../models/priodeModels');
const Weekday = require('../models/weakdayModel');

//************  add Priode *************** */
exports.add_priode = async (req, res) => {
  const { start_time, end_time } = req.body;
  const { rutin_id } = req.params;

  try {
    // Check if the routine exists
    const existingRoutine = await Routine.findOne({ _id: rutin_id });
    if (!existingRoutine) return res.status(404).send({ message: 'Routine not found' });

    // Count the number of existing priodes for the routine
    const priodeCount = await Priode.countDocuments({ rutin_id });

    // Create a new priode instance with the next priode number
    const priode = new Priode({
      priode_number: priodeCount === 0 ? 1 : priodeCount + 1,
      start_time,
      end_time,
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
//************  delete Priode *************** */
exports.delete_priode = async (req, res) => {
  const { priode_id } = req.params;

  try {
    // Find the priode to be deleted and its associated routine
    const priode = await Priode.findOne({ _id: priode_id }).populate('rutin_id');
    if (!priode) return res.status(404).send({ message: 'Priode not found' });

    // step 2 chack the priode number is allrady using or not 
    const weekdayUsing = await Weekday.findOne({
      routine_id: priode.rutin_id,
      $or: [
        { start: { $in: [priode.priode_number] } },
        { end: { $in: [priode.priode_number] } }
      ]
    });
    if (weekdayUsing) return res.status(404).send({ message: 'Cannot delete this priode because it is being used in a weekday' });



    // Delete the priode
    await priode.deleteOne();

    // Update the priode numbers of the remaining priodes in the routine
    const remainingPriodes = await Priode.find({ rutin_id: priode.rutin_id })
      .sort({ priode_number: 'asc' });
    let priodeNumber = 1;
    for (let i = 0; i < remainingPriodes.length; i++) {
      const currPriode = remainingPriodes[i];
      if (currPriode.priode_number !== priodeNumber) {
        currPriode.priode_number = priodeNumber;
        await currPriode.save();
      }
      priodeNumber++;
    }

    res.status(200).send({ message: 'Priode deleted', deleted: priode });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};


//************  eddit priode ***************** */
exports.edit_priode = async (req, res) => {
  const { start_time, end_time } = req.body;
  const { rutin_id, priode_id } = req.params;

  try {
    // // Check if the routine exists
    // const existingRoutine = await Routine.findOne({ _id: rutin_id });
    // if (!existingRoutine) return res.status(404).send({ message: 'Routine not found' });

    // Find the priode to be edited
    const priode = await Priode.findOne({ _id: priode_id });
    if (!priode) return res.status(404).send({ message: 'Priode not found' });

    // Update the priode start and end time
    priode.start_time = start_time;
    priode.end_time = end_time;

    // Save the updated priode to the database
    const updated = await priode.save();

    res.status(200).send({ message: 'Priode updated', updated });
  } catch (error) {
    if (!handleValidationError(res, error)) {
      return res.status(500).send({ message: error.message });
    }
  }
};

//************ all priode  *************** */
exports.all_priode = async (req, res) => {
  const { rutin_id } = req.params;

  console.log(`rutin_id: ${rutin_id}`);

  try {
    const priodes = await Priode.find({ rutin_id });
    res.send({ message: 'All priodes list', priodes });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
};
//************ find priode by id  *************** */

exports.find_priode_by_id = async (req, res) => {
  const { priode_id } = req.params;

  try {
    // Find the priode by its id
    const priode = await Priode.findById(priode_id);
    if (!priode) return res.status(404).send({ message: 'Priode not found' });

    res.status(200).send(priode);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
