const Routine = require('../models/rutin_models');
const Class = require('../models/class_model');


//************  add Priode *************** */
exports.add_priode = async (req, res) => {

  const { start_time, end_time } = req.body;

  try {

    const routine = req.routine;
    routine.priode.push({ start_time, end_time });
    const aded = await routine.save();    // Save the changes to the routine



    res.status(200).send({ message: 'Period added to routine', aded });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
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