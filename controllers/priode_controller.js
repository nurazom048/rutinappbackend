const Routine = require('../models/rutin_models');
const Class = require('../models/class_model');
const { handleValidationError } = require('../methode/validation_error');



//************  add Priode *************** */
exports.add_priode = async (req, res) => {
  const routine = req.routine;

  const { start_time, end_time, priode_number } = req.body;
  const { rutin_id } = req.params;

  try {

    //.. Chack this Priode number is free or not 
    const existingRoutine = await Routine.findOne({ _id: rutin_id });
    const isBokingPriodeNumber = existingRoutine.priode.some(priode => priode.priode_number.toString() === priode_number.toString());
    if (isBokingPriodeNumber) return res.status(404).send({ message: "In this routine, this period number is not free" });


    routine.priode.push({ start_time, end_time, priode_number });
    const added = await routine.save();

    res.status(200).send({ message: 'Period added to routine', added });
  } catch (error) {
    if (!handleValidationError(res, error))
      return res.status(500).send({ message: error.message });

  }
}



//************  Delete Priode *************** */
exports.delete_priode = async (req, res) => {


  try {
    const routine = req.routine;
    const priode = req.priode;

    priode.remove();
    await routine.save();
    res.json({ message: "Priode deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};





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