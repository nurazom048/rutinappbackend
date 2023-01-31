
 const Routine = require('../models/rutin_models')
 const Class = require('../models/class_model');

 
 
 
  //************   edit_class       *************** */
 exports.create_class =  async (req, res) => {
    const { rutin_id } = req.params;
    const { name,room,subjectcode, start, end,weekday,start_time,end_time } = req.body;
    console.log(req.user);
  
  
    const rutin = await Routine.findOne( {_id : rutin_id});
    console.log(rutin.ownerid.toString());
  
    if (!rutin) return res.status(404).send('Routine not found');
    if (rutin.ownerid.toString() !== req.user.id)
      return res.status(401).send('You can only add classes to your own routine');

      // validation
      if (start > start ) return res.status(404).send({message:'end priode should be biger the star prioide '});
   
      const isAllradyBooking = await Class.findOne( {  weekday , start , rutin_id: rutin._id} );
      if (isAllradyBooking) return res.status(404).send({message:'on this weakday staring priode is not free'});
      const isAllradyBookingEnd = await Class.findOne( {  weekday , end , rutin_id : rutin._id} );
      if (isAllradyBookingEnd) return res.status(404).send({message:'on this weakday end priode is not free'});
  
    const newClass = new Class({
      name, room,subjectcode,start,end,weekday, start_time,end_time ,rutin_id});
  
      await newClass.save();
      rutin.class.push(newClass._id);
      await rutin.save();
      res.send({ class: newClass, message: 'Class added successfully' });
  }
  

  //************   edit_class       *************** */
  exports.edit_class = async (req, res) => {

    const { rutin_id, class_id } = req.params;
    const { name,room,subjectcode, start, end,weekday,start_time,end_time } = req.body;


    try {

  /// 1 chack rutin
    const rutin = await Routine.findOne({ _id: rutin_id });
    if (!rutin) return res.status(404).send('Routine not found');
    if (rutin.ownerid.toString() !== req.user.id)
      return res.status(401).send('You can only edit classes in your own routine');
    
      // 2  chack booking
    // const isAllradyBooking = await Class.findOne({ weekday, start, rutin_id: rutin._id });
    // if (isAllradyBooking) return res.status(404).send({ message: 'This week day and start time is already booked' });
    // const isAllradyBookingEnd = await Class.findOne({ weekday, end, rutin_id: rutin._id });
    // if (isAllradyBookingEnd) return res.status(404).send({ message: 'This week day and end time is already booked' });
    

    // 3 update 
    const updatedClass = await Class.findOneAndUpdate(
      { _id: class_id, rutin_id: rutin._id },
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
  const { rutin_id, class_id } = req.params;
  console.log(req.user);
  


  try {
    //.. 1 chack rutin 
    const routine = await Routine.findOne({ _id: rutin_id });
    console.log(routine.ownerid.toString()); 
    if (!routine) return res.status(404).send('Routine not found');
    if (routine.ownerid.toString() !== req.user.id)
    return res.status(401).send('You can only delete classes from your own routine');
    

    // 2 chack clases
    const classs = await Class.findOne({ _id: class_id });
    if (!classs) return res.status(404).send('Class not found');
    

    // 3 remove
    await classs.remove();
    res.send({ message: 'Class deleted successfully' });
    
    
  } catch (error) {
    res.status(500).send(error);

  }}



//************ show_weekday_classes *************** */
exports.show_weekday_classes = async (req, res) => {
  const { rutin_id, weekday } = req.params;

  try {
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.status(404).send('Routine not found');
    
    const classes = await Class.find({ 
      weekday, 
      rutin_id: routine._id 
    }).sort({start_time: 1});
    
    res.send({ classes });
  } catch (error) {
    res.status(400).send({ error });
  }
};
