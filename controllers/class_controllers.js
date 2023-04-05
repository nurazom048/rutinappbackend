
const Routine = require('../models/rutin_models')
const Class = require('../models/class_model');
const Account = require('../models/Account');
const { handleValidationError } = require('../methode/validation_error');
const { getClasses } = require('../methode/get_class_methode');





//************   creat class       *************** */
exports.create_class = async (req, res) => {

  const { rutin_id } = req.params;
  const { name, room, subjectcode, start, end, weekday, instuctor_name, has_class } = req.body;
  console.log(req.body);
  try {


    const rutin = await Routine.findOne({ _id: rutin_id });
    if (!rutin) return res.status(404).send('Routine not found');
    if (rutin.ownerid.toString() !== req.user.id)
      return res.status(401).send('You can only add classes to your own routine');

    // validation

    if (weekday < 1 || weekday > 7) throw new Error('Weekday should be between 1 and 7');

    const isAllradyBooking = await Class.findOne({ weekday, start, rutin_id: rutin._id });
    if (isAllradyBooking) {
      return res.status(400).send({ message: 'This weekday starting period is already booked' });
    }

    const isAllradyBookingEnd = await Class.findOne({ weekday, end, rutin_id: rutin._id });
    if (isAllradyBookingEnd) {
      return res.status(400).send({ message: 'This weekday ending period is already booked' });
    }

    const isAllradyStrt = await Class.findOne({ weekday, start: end, rutin_id: rutin._id });
    if (isAllradyStrt) return res.status(400).send({ message: 'End period is not free' });


    const isAllradyEnd = await Class.findOne({ weekday, end: start, rutin_id: rutin._id });
    if (isAllradyEnd) return res.status(400).send({ message: 'Start period is not free' });


    const newClass = new Class({
      name, room, subjectcode, start, end, weekday, rutin_id, instuctor_name, has_class
    });

    await newClass.save();
    const new_id_Into_rutin = await Routine.findOneAndUpdate({ _id: rutin_id }, { $push: { class: newClass._id } }, { new: true });

    rutin.class.push(newClass._id);
    await rutin.save();
    res.send({ class: newClass, message: 'Class added successfully', new_id_Into_rutin });
  } catch (error) {
    if (!handleValidationError(res, error))
      return res.status(500).send({ message: error.message });
  }
};



//************   edit_class       *************** */
exports.edit_class = async (req, res) => {

  console.log("from eddit");
  console.log(req.body);

  const { class_id } = req.params;
  const { name, room, subjectcode, start, end, weekday, start_time, end_time } = req.body;


  try {
    // 1 chack clases
    const classs = await Class.findOne({ _id: class_id });
    if (!classs) return res.status(404).send('Class not found');

    /// 2 chack rutin
    const rutin = await Routine.findOne({ _id: classs.rutin_id });
    if (!rutin) return res.status(404).send('Routine not found');

    // 3 chack permition 
    if (rutin.ownerid.toString() !== req.user.id)
      return res.status(401).send('You can only edit classes in your own routine');

    // 2  chack booking
    // const isAllradyBooking = await Class.findOne({ weekday, start, rutin_id: rutin._id });
    // if (isAllradyBooking) return res.status(404).send({ message: 'This week day and start time is already booked' });
    // const isAllradyBookingEnd = await Class.findOne({ weekday, end, rutin_id: rutin._id });
    // if (isAllradyBookingEnd) return res.status(404).send({ message: 'This week day and end time is already booked' });


    // 5 update 
    const updatedClass = await Class.findOneAndUpdate(
      { _id: class_id, rutin_id: classs.rutin_id },
      { name, room, subjectcode, start, end, weekday, start_time, end_time },
      { new: true }
    );
    if (!updatedClass) return res.status(404).send('Class not found');
    console.log(updatedClass);
    res.send({ class: updatedClass, message: 'Class updated successfully' });


    //
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error updating class' });
  }
};



//************ delete_class *************** */
exports.delete_class = async (req, res) => {
  const { class_id } = req.params;
  console.log(req.user);



  try {


    // 1 chack clases
    const classs = await Class.findOne({ _id: class_id });
    if (!classs) return res.status(404).send('Class not found');

    //..2 chack rutin 
    const routine = await Routine.findOne({ _id: classs.rutin_id });
    console.log(routine.ownerid.toString());
    if (!routine) return res.status(404).send('Routine not found');


    // 3 chack premition
    if (routine.ownerid.toString() !== req.user.id)
      return res.status(401).send('You can only delete classes from your own routine');




    // 4 remove
    await classs.remove();
    res.send({ message: 'Class deleted successfully' });


  } catch (error) {
    res.status(500).send(error);

  }
}



//************ show_weekday_classes *************** */
exports.show_weekday_classes = async (req, res) => {
  const { rutin_id, weekday } = req.params;
  console.log(weekday);
  try {
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.status(404).send('Routine not found');

    const classes = await Class.find({
      weekday: 1,
      rutin_id,
    }).sort({ start_time: 1 });

    res.send({ classes });
  } catch (error) {
    res.status(400).send({ error });
  }
};


//************ all class *************** */
exports.allclass = async (req, res) => {
  const { rutin_id } = req.params;

  try {
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.status(404).send('Routine not found');


    // Find the routine's priodes and sort them by priode_number
    const priodes = routine.priode.sort((a, b) => a.priode_number - b.priode_number);

    //.. Get class By Weakday
    const Sunday = await getClasses(1, rutin_id, priodes);
    const Monday = await getClasses(2, rutin_id, priodes);
    const Tuesday = await getClasses(3, rutin_id, priodes);
    const Wednesday = await getClasses(4, rutin_id, priodes);
    const Thursday = await getClasses(5, rutin_id, priodes);
    const Friday = await getClasses(6, rutin_id, priodes);
    const Saturday = await getClasses(7, rutin_id, priodes);

    //
    const owner = await Account.findOne({ _id: routine.ownerid }, { name: 1, ownerid: 1, image: 1, username: 1 });


    res.send({ _id: routine._id, image: routine.image, rutin_name: routine.name, priodes, Classes: { Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday }, owner });
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
};











//************   edit_class       *************** */
exports.findclass = async (req, res) => {

  const { class_id } = req.params;
  console.log(class_id);



  try {
    // 1 chack clases
    const classs = await Class.findOne({ _id: class_id });
    if (!classs) return res.status(404).send('Class not found');

    res.status(200).send({ classs });

    //
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error updating class' });
  }
};

