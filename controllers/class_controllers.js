
const Routine = require('../models/rutin_models')
const Class = require('../models/class_model');
const Account = require('../models/Account');
const { handleValidationError } = require('../methode/validation_error');
const { getClasses } = require('../methode/get_class_methode');
const Priode = require('../models/priodeModels');
const Weekday = require('../models/weakdayModel');




//************   creat class       *************** */


exports.create_class = async (req, res) => {
  const { rutin_id } = req.params;
  const { name,  subjectcode, instuctor_name } = req.body;
  const { num, start,room, end,  start_time, end_time } = req.body;

  console.log(req.body);
  console.log(rutin_id);



  try {

    // find  Rutine to chack owener
    const rutin = await Routine.findOne({ _id: rutin_id });
    if (!rutin) return res.status(404).send('Routine not found');
    if (rutin.ownerid.toString() !== req.user.id) return res.status(401).send('You can only add classes to your own routine');
    /////////////
    // validation 1 chack priod is created or not  
    const findEnd = await Priode.findOne({ rutin_id, priode_number: start });
    const findstarpriod = await Priode.findOne({ rutin_id, priode_number: end });
    if (!findEnd) return res.status(404).send({ message: `${end} priode is not created` });
    if (!findstarpriod) return res.status(404).send({ message: `${start}priode is not created` });

    //  validation  2 chack booking
    const startPriodeAllradyBooking = await Weekday.findOne({ routine_id:rutin_id, num, start });
    console.log(startPriodeAllradyBooking);
    if (startPriodeAllradyBooking) return res.status(404).send({ message: 'Sart priode is allrady booking ' });
    const endPriodeAllradyBooking = await Weekday.findOne({ routine_id:rutin_id, num, end });
    if (endPriodeAllradyBooking) return res.status(404).send({ message: 'end priode is allrady booking' });

    // console.log(start);
    // console.log(end);
    const mid = [];
    const allStart = await Weekday.find({ routine_id:rutin_id, num }, { start: 1 });
    const allEnd = await Weekday.find({ routine_id:rutin_id, num }, { end: 1 });

    for (let i = 0; i < allStart.length; i++) {
      for (let j = allStart[i].start + 1; j < allEnd[i].end; j++) {
        mid.push(j);
      }
    }
    console.log(mid);

    if (mid.includes(start)) return res.status(400).send({ message: `${start} This  period is already booked  all booking upto  ${mid} ` });
    if (mid.includes(end)) return res.status(400).send({ message: `This ${end}  period is already booked all booking up to  ${mid} ` });

    //******* main code  */
    // create and save new class
    const newClass = new Class({
      name,
      subjectcode,
      rutin_id,
      instuctor_name
    });
    await newClass.save();

    // create and save new weekday
    const newWeekday = new Weekday({
      class_id: newClass._id,
      routine_id: rutin_id,
      num: num,
      start,
      room,
      end,
      start_time,
      end_time
    });
    await newWeekday.save();

    // add new class to the class array of the routine
    rutin.class.push(newClass._id);
    await rutin.save();

    const updatedRoutine = await Routine.findOne({ _id: rutin_id }).populate('class');
    res.send({ class: newClass, message: 'Class added successfully', routine: updatedRoutine, newWeekday });

    //
  } catch (error) {


    if (!handleValidationError(res, error))
      return res.status(500).send({ message: error.message });
  }
};







//,, Add waakday to class
exports.addWeakday = async (req, res) => {
  const { class_id } = req.params;
  const { num, room, start, end } = req.body;

  try {
    const classFind = await Class.findOne({ _id: class_id });
    if (!classFind) return res.status(404).send('Class not found');

    const routine = await Routine.findOne({ _id: classFind.rutin_id });
    if (!routine) return res.status(404).send('Routine not found');
    console.log(routine._id);



    // priode not created validations
    const findEnd = await Priode.findOne({ rutin_id: classFind.rutin_id, priode_number: start });
    const findstarpriod = await Priode.findOne({ rutin_id: classFind.rutin_id, priode_number: end });
    if (!findEnd) return res.status(404).send({ message: `${end} priode is not created` });
    if (!findstarpriod) return res.status(404).send({ message: `${start}priode is not created` });




    //  validation  2 chack booking

    const startPriodeAllradyBooking = await Weekday.findOne({ class_id, num, start });
    if (startPriodeAllradyBooking) return res.status(404).send({ message: 'Sart priode is allrady booking ' });

    const endPriodeAllradyBooking = await Weekday.findOne({ class_id, num, end });
    if (endPriodeAllradyBooking) return res.status(404).send({ message: 'end priode is allrady booking' });

    // console.log(start);
    // console.log(end);


    const mid = [];
    const allStart = await Weekday.find({ num });
    const allEnd = await Weekday.find({ num }, { end: 1 });

    for (let i = 0; i < allStart.length; i++) {
      for (let j = allStart[i].start + 1; j < allEnd[i].end; j++) {
        mid.push(j);
      }
    }
    console.log(mid);

    if (mid.includes(start)) return res.status(400).send({ message: `${start} This  period is already booked  all booking upto  ${mid} ` });
    if (mid.includes(end)) return res.status(400).send({ message: `This ${end}  period is already booked all booking up to  ${mid} ` });





    // create and save new weekday
    const newWeekday = new Weekday({
      class_id,
      routine_id: classFind.rutin_id.toString(),
      num,
      room:room,
      start,
      end
    });
    await newWeekday.save();

    // add new weekday to the weekday array of the routine
    classFind.weekday.push(newWeekday._id);
    await classFind.save();

    res.send({ message: 'Weekday added successfully', newWeekday });
  } catch (error) {
    if (!handleValidationError(res, error)) {
      return res.status(500).send({ message: error.message });
    }
  }
};
//******* deleteWeekdayById ************** */

exports.deleteWeekdayById = async (req, res) => {
  const { id } = req.params;

  console.log(id);

  try {

    const weekday = await Weekday.findOne({  _id:id });
    if (!weekday) return res.status(404).send('Weekday not found');
    
    await Weekday.deleteOne({ _id: id });

    const weekdays = await Weekday.find({ class_id :weekday.class_id });

    res.send({ message: 'Weekday deleted successfully' , weekdays });
  } catch (error) {
    res.status(500).send({ message: error.message,weekdays:[] });
  }
};


//******* show all weekday in a class ************** */

exports.allWeekdayInClass = async (req, res) => {

  const { class_id } = req.params;

  try {
    // 1 cweekdays
    const weekdays = await Weekday.find({ class_id });

    res.send({ message: "All weekday in the class", weekdays });
  } catch (error) {
    return res.status(500).send({ message: error.toString, weekdays: [] });

  }

}

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





  } catch (error) {
    if (!handleValidationError(res, error))
      return res.status(500).send({ message: error.message });
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


    // find priod 
    const priodes = await Priode.find({ rutin_id: rutin_id });

    //.. Get class By Weakday
    const allDay = await Weekday.find({ routine_id: rutin_id }).populate('class_id');

    const SundayClass = await Weekday.find({ routine_id: rutin_id, num: 0 }).populate('class_id');
    const MondayClass = await Weekday.find({ routine_id: rutin_id, num: 1 }).populate('class_id');
    const TuesdayClass = await Weekday.find({ routine_id: rutin_id, num: 2 }).populate('class_id');
    const WednesdayClass = await Weekday.find({ routine_id: rutin_id, num: 3 }).populate('class_id');
    const ThursdayClass = await Weekday.find({ routine_id: rutin_id, num: 4 }).populate('class_id');
    const FridayClass = await Weekday.find({ routine_id: rutin_id, num: 5 }).populate('class_id');
    const SaturdayClass = await Weekday.find({ routine_id: rutin_id, num: 6 }).populate('class_id');


    // addd start time and end time with it 
    const allClass = await getClasses(allDay, priodes)

    const Sunday = await getClasses(SundayClass, priodes)
    const Monday = await getClasses(MondayClass, priodes);
    const Tuesday = await getClasses(TuesdayClass, priodes);
    const Wednesday = await getClasses(WednesdayClass, priodes);
    const Thursday = await getClasses(ThursdayClass, priodes);
    const Friday = await getClasses(FridayClass, priodes);
    const Saturday = await getClasses(SaturdayClass, priodes);


 


    const owner = await Account.findOne({ _id: routine.ownerid }, { name: 1, ownerid: 1, image: 1, username: 1 });

    res.send({ _id: routine._id, rutin_name: routine.name, priodes, Classes: { allClass, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday }, owner });

  } catch (error) {

    console.error(error);

    res.status(500).send('Server Error');
  }
};










//************   edit_class       *************** */
exports.findclass = async (req, res) => {

  const { class_id } = req.params;
  console.log(class_id);



  try {
    // 1 chack clases
    const classs = await Class.findOne({ _id: class_id }, { weekday: 0, summary: 0, _v: 0 });
    if (!classs) return res.status(404).send({ message: 'Class not found' });
    // 2 cweekdays
    const weekdays = await Weekday.find({ class_id });
    res.status(200).send({ message: "All weekday in the class", classs, weekdays });

    //
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error updating class',weekdays:[] });
  }
};

