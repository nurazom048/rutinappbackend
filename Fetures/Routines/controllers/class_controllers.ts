import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Models
import Routine from '../models/routine.models';
import Class from '../models/class.model';
import Weekday from '../models/weakday.Model';
import RoutineMember from '../models/routineMembers.Model';
import Account from '../../Account/models/Account.Model';
import Priode from '../models/priode.Models';


// routine firebase and helper
import { deleteSummariesFromFirebaseBaseOnClassId } from '../firebase/summary.firebase';
import { getClasses, getNotificationClasses } from '../helper/class.helper';
import { handleValidationError } from '../../../utils/validation_error';

//************   create class       *************** */
export const create_class = async (req: any, res: Response) => {
  // const { routineID } = req.params;
  const { name, subjectcode, instuctor_name } = req.body;
  const { start_time, end_time, room } = req.body;
  const { routineID, weekday, start, end } = req.validateClassBookingAndPeremption;

  try {
    // create and save new class
    const newClass = new Class({
      name,
      subjectcode,
      rutin_id: routineID,
      instuctor_name
    });
    await newClass.save();

    // create and save new weekday
    const newWeekday = new Weekday({
      class_id: newClass._id,
      routine_id: routineID,
      num: weekday,
      start,
      room,
      end,
      start_time,
      end_time
    });
    await newWeekday.save();


    const updatedRoutine = await Routine.findOne({ _id: routineID });
    res.send({ _id: newClass.id, class: newClass, message: 'Class added successfully', routine: updatedRoutine, newWeekday });

    //
  } catch (error: any) {
    console.log({ message: error.message });
    if (!handleValidationError(res, error))
      return res.status(500).send({ message: error.message });
  }
};



//,, Add weekday to class
export const addWeekday = async (req: any, res: Response) => {
  // Come after middleware
  const { classID } = req.params;
  const { num, room, start, end } = req.body;
  console.log(req.body)

  try {
    //
    const classFind = await Class.findById(classID);
    if (!classFind) return res.status(404).send({ message: 'Class not found' });

    // create and save new weekday
    const newWeekday = new Weekday({
      class_id: classID,
      routine_id: classFind.rutin_id.toString(),
      num,
      room: room,
      start,
      end
    });
    await newWeekday.save();

    // add new weekday to the weekday array of the routine
    classFind.weekday.push(newWeekday._id);
    await classFind.save();

    res.send({ message: 'Weekday added successfully', newWeekday });
  } catch (error: any) {
    if (!handleValidationError(res, error)) {
      return res.status(500).send({ message: error.message });
    }
  }
};
//******* deleteWeekdayById ************** */
export const deleteWeekdayById = async (req: any, res: Response) => {
  const { id, classID } = req.params;

  try {
    // Check if the class has at least 1 weekday
    const weekdaysCount = await Weekday.countDocuments({ class_id: classID });
    if (weekdaysCount === 1) {
      return res.status(404).send({ message: 'Class must have at least 1 weekday, cannot delete it' });
    }

    // Find and delete the weekday
    const weekday = await Weekday.findOneAndDelete({ _id: id });
    if (!weekday) {
      return res.status(404).send('Weekday not found');
    }

    // Find the remaining weekdays for the class
    const weekdays = await Weekday.find({ class_id: classID });
    console.log({ message: 'Weekday deleted successfully', weekdays })
    res.send({ message: 'Weekday deleted successfully', weekdays });
  } catch (error: any) {
    res.status(500).send({ message: error.message, weekdays: [] });
  }
};



//******* show all weekday in a class ************** */

export const allWeekdayInClass = async (req: any, res: Response) => {

  const { class_id } = req.params;

  try {
    if (!class_id) return res.status(500).send({ message: "ClassId not found", weekdays: [] });
    // 1 weekdays
    const weekdays = await Weekday.find({ class_id: class_id });

    res.send({ message: "All weekday in the class", weekdays });
  } catch (error: any) {
    console.log(error)
    return res.status(500).send({ message: error.toString, weekdays: [] });

  }

}

//************   edit_class       *************** */
export const edit_class = async (req: any, res: Response) => {

  console.log("from edit");
  console.log(req.body);

  const { class_id } = req.params;
  const { name, room, subjectcode, start, end, weekday, start_time, end_time } = req.body;


  try {
    // 1 chack class
    const classs = await Class.findOne({ _id: class_id });
    if (!classs) return res.status(404).send({ message: 'Class not found' });

    /// 2 chack rutin
    const rutin = await Routine.findOne({ _id: classs.rutin_id });
    if (!rutin) return res.status(404).send({ message: 'Routine not found' });

    // Check permission: owner or captain
    const routineMember = await RoutineMember.findOne({ RutineID: classs.rutin_id, memberID: req.user.id });
    if (!routineMember || (!routineMember.owner && !routineMember.captain)) {
      return res.status(401).json({ message: "Only captains and owners can update classes" });
    }


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
    if (!updatedClass) return res.status(404).send({ message: 'Class not found' });
    console.log(updatedClass);
    res.send({ class: updatedClass, message: 'Class updated successfully' });





  } catch (error: any) {
    console.log(error)
    if (!handleValidationError(res, error))
      return res.status(500).send({ message: error.message });
  }
};

//************ delete_class ***************
export const delete_class = async (req: any, res: Response) => {
  const { class_id } = req.params;
  console.log('request to delete class')


  try {

    // Step: 1 check Permeation 
    const classs = await Class.findById(class_id);
    if (!classs) return res.status(404).send({ message: 'Class not found' });

    // Check if routine exists
    const routine = await Routine.findById(classs.rutin_id);
    if (!routine) return res.status(404).send({ message: 'Routine not found' });
    // Check permission
    if (routine.ownerid.toString() !== req.user.id)
      return res.status(401).send({ message: 'You can only delete classes from your own routine' });

    // step 2 : delete 
    await deleteSummariesFromFirebaseBaseOnClassId(class_id);
    await Weekday.deleteMany({ class_id: class_id });
    // Delete the class
    await Class.findByIdAndDelete(class_id);
    // step 3: Send response
    // console.log({ message: 'Class deleted successfully' })
    res.send({ message: 'Class deleted successfully' });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
};


//************ show_weekday_classes *************** */
export const show_weekday_classes = async (req: any, res: Response) => {
  const { routineID, weekday } = req.params;
  console.log(weekday);
  try {
    const routine = await Routine.findById(routineID);
    if (!routine) return res.status(404).send('Routine not found');

    const classes = await Class.find({
      weekday: 1,
      rutin_id: routineID,
    }).sort({ start_time: 1 });

    res.send({ classes });
  } catch (error: any) {
    res.status(400).send({ error });
  }
};


//************ all class *************** */
export const allclass = async (req: any, res: Response) => {
  const { routineID } = req.params;

  try {
    const routine = await Routine.findById(routineID);
    if (!routine) return res.status(404).send('Routine not found');


    // find period 
    const priodes = await Priode.find({ rutin_id: routineID });

    //.. Get class By Weakday
    const allDayWithNull = await Weekday.find({ routine_id: routineID }).populate('class_id');
    const allDay = allDayWithNull.filter((weekday: any) => weekday.class_id !== null);

    // with null class id valu 
    const SundayClassWithNull = await Weekday.find({ routine_id: routineID, num: 0 }).populate('class_id');
    const MondayClassWithNull = await Weekday.find({ routine_id: routineID, num: 1 }).populate('class_id');
    const TuesdayClassWithNull = await Weekday.find({ routine_id: routineID, num: 2 }).populate('class_id');
    const WednesdayClassWithNull = await Weekday.find({ routine_id: routineID, num: 3 }).populate('class_id');
    const ThursdayClassWithNull = await Weekday.find({ routine_id: routineID, num: 4 }).populate('class_id');
    const FridayClassWithNull = await Weekday.find({ routine_id: routineID, num: 5 }).populate('class_id');
    const SaturdayClassWithNull = await Weekday.find({ routine_id: routineID, num: 6 }).populate('class_id');
    // with out null valu
    // without null value
    const SundayClass = SundayClassWithNull.filter((weekday: any) => weekday.class_id !== null);
    const MondayClass = MondayClassWithNull.filter((weekday: any) => weekday.class_id !== null);
    const TuesdayClass = TuesdayClassWithNull.filter((weekday: any) => weekday.class_id !== null);
    const WednesdayClass = WednesdayClassWithNull.filter((weekday: any) => weekday.class_id !== null);
    const ThursdayClass = ThursdayClassWithNull.filter((weekday: any) => weekday.class_id !== null);
    const FridayClass = FridayClassWithNull.filter((weekday: any) => weekday.class_id !== null);
    const SaturdayClass = SaturdayClassWithNull.filter((weekday: any) => weekday.class_id !== null);


    // addd start time and end time with it 
    const allClass = await getClasses(allDay, priodes)

    const Sunday = await getClasses(SundayClass, priodes)
    const Monday = await getClasses(MondayClass, priodes);
    const Tuesday = await getClasses(TuesdayClass, priodes);
    const Wednesday = await getClasses(WednesdayClass, priodes);
    const Thursday = await getClasses(ThursdayClass, priodes);
    const Friday = await getClasses(FridayClass, priodes);
    const Saturday = await getClasses(SaturdayClass, priodes);

    //
    const uniqClass = await Class.find({ rutin_id: routineID });
    const owner = await Account.findOne({ _id: routine.ownerid }, { name: 1, ownerid: 1, image: 1, username: 1 });

    res.send({ _id: routine._id, rutin_name: routine.name, priodes, uniqClass: uniqClass, Classes: { allClass, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday }, owner });

  } catch (error: any) {

    console.error(error);

    res.status(500).send('Server Error');
  }
};



//************   edit_class       *************** */
export const findclass = async (req: any, res: Response) => {

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
  } catch (error: any) {
    console.error(error);
    res.status(500).send({ message: 'Error updating class', weekdays: [] });
  }
};

//************ all class *************** */
export const classNotification = async (req: any, res: Response) => {
  const { id } = req.user;

  try {

    // find all the routines where notification is on
    const findRoutines = await RoutineMember.find({ memberID: id });
    if (!findRoutines) {
      return res.status(404).send(findRoutines);
    }
    const filteredRoutineIds: string[] = [];
    findRoutines.forEach((routine: any) => {
      if (routine.RutineID) {
        filteredRoutineIds.push(routine.RutineID);
      }
    });


    const routines = await Routine.find({ _id: { $in: filteredRoutineIds } });
    if (!routines) return res.status(404).send({ message: 'Routines not found' });


    // Find priodes
    const priodes = await Priode.find({ rutin_id: { $in: filteredRoutineIds } });
    console.log(priodes)
    // Get class by Weekday
    const allDayWithNull = await Weekday.find({ routine_id: { $in: filteredRoutineIds } }).populate('class_id');
    const allDay = allDayWithNull.filter((weekday: any) => weekday.class_id !== null);
    // console.log({ allday: allDay });

    // add start time and end time with it 
    const allClass = await getNotificationClasses(allDay, priodes)
    const filteredClasses = allClass.filter((classItem: any) => classItem.start_time && classItem.end_time);


    // console.log({ notificationOnClasses: filteredClasses });
    res.send({ notificationOnClasses: filteredClasses });


  } catch (error: any) {
    console.error(error);
    res.status(500).send({ message: 'Server Error', notificationOnClasses: [] });
  }
};