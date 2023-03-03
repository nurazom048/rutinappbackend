
const Routine = require('../models/rutin_models')
const Class = require('../models/class_model');
const Account = require('../models/Account');




//************   creat class       *************** */
exports.create_class = async (req, res) => {
  const { rutin_id } = req.params;
  const { name, room, subjectcode, start, end, weekday, start_time, end_time, instuctor_name, has_class } = req.body;
  console.log(start_time, end_time);


  const rutin = await Routine.findOne({ _id: rutin_id });
  // console.log(rutin.ownerid.toString());

  if (!rutin) return res.status(404).send('Routine not found');
  if (rutin.ownerid.toString() !== req.user.id)
    return res.status(401).send('You can only add classes to your own routine');

  // validation
  if (start > start) return res.status(404).send({ message: 'end priode should be biger the star prioide ' });

  const isAllradyBooking = await Class.findOne({ weekday, start, rutin_id: rutin._id });
  if (isAllradyBooking) return res.status(404).send({ message: 'on this weakday staring priode is not free' });
  const isAllradyBookingEnd = await Class.findOne({ weekday, end, rutin_id: rutin._id });
  if (isAllradyBookingEnd) return res.status(404).send({ message: 'on this weakday end priode is not free' });
  //
  const isAllradyStrt = await Class.findOne({ weekday, start: end, rutin_id: rutin._id });
  if (isAllradyStrt) return res.status(404).send({ message: 'end priode is not free' });
  const isAllradyEnd = await Class.findOne({ weekday, end: start, rutin_id: rutin._id });
  if (isAllradyEnd) return res.status(404).send({ message: 'start priode is not free' });

  const newClass = new Class({
    name, room, subjectcode, start, end, weekday, start_time, end_time, rutin_id, instuctor_name, has_class
  });

  await newClass.save();
  const new_id_Into_rutin = await Routine.findOneAndUpdate({ _id: rutin_id }, { $push: { class: newClass._id } }, { new: true });

  rutin.class.push(newClass._id);
  await rutin.save();
  res.send({ class: newClass, message: 'Class added successfully', new_id_Into_rutin });
}


//************   edit_class       *************** */
exports.edit_class = async (req, res) => {

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
    // console.log(routine);

    const priode = await Routine.find({ _id: rutin_id }).select('-_id priode');


    // console.log(priode);
    const priodes = priode[0].priode.map(p => ({
      start_time: p.start_time,
      end_time: p.end_time,
      _id: p._id,
    }));

    const Sunday = await Class.find({ weekday: 1, rutin_id: rutin_id }).select('-summary -__v -rutin_id').sort({ start: 1 });
    const Monday = await Class.find({ weekday: 2, rutin_id: rutin_id }).select('-summary -__v -rutin_id').sort({ start: 1 });
    const Tuesday = await Class.find({ weekday: 3, rutin_id: rutin_id }).select('-summary -__v -rutin_id').sort({ start: 1 });
    const Wednesday = await Class.find({ weekday: 4, rutin_id: rutin_id }).select('-summary -__v -rutin_id').sort({ start: 1 });
    const Thursday = await Class.find({ weekday: 5, rutin_id: rutin_id }).select('-summary -__v -rutin_id').sort({ start: 1 });
    const Friday = await Class.find({ weekday: 6, rutin_id: rutin_id }).select('-summary -__v -rutin_id').sort({ start: 1 });
    const Saturday = await Class.find({ weekday: 7, rutin_id: rutin_id }).select('-summary -__v -rutin_id').sort({ start: 1 });


    //
    const routines = await Routine.findById(rutin_id);
    const owner = await Account.findOne({ _id: routines.ownerid }, { _id: 1, name: 1, ownerid: 1, image: 1, username: 1 });
    //
    const listOfCa10s = await Routine.findOne({ _id: rutin_id }, { _id: 0, cap10s: 1 })
      .populate({
        path: 'cap10s.cap10Ac',
        select: 'name image username'
      })
      .lean();

    if (listOfCa10s.cap10s && Array.isArray(listOfCa10s.cap10s)) {
      for (const cap10 of listOfCa10s.cap10s) {
        cap10._id = cap10.cap10Ac._id;
        cap10.username = cap10.cap10Ac.username;
        cap10.name = cap10.cap10Ac.name;
        cap10.image = cap10.cap10Ac.image;
        delete cap10.cap10Ac;
      }
    }
    const finalCap10List = listOfCa10s.cap10s ?? [];




    res.send({ rutin_name: routine.name, priodes, Classes: { Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday }, owner, finalCap10List, });
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

