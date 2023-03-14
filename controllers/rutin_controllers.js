const Account = require('../models/Account')
const Routine = require('../models/rutin_models')


//********** createRutin   ************* */
exports.createRutin = async (req, res) => {
  const { name } = req.body;
  console.log(req.body)
  console.log(req.user);
  const ownerid = req.user.id;

  try {
    // Create a new routine

    const routine = new Routine({ name, ownerid });
    const created = await routine.save();

    const user = await Account.findOneAndUpdate({ _id: ownerid }, { $push: { routines: created._id } }, { new: true });

    // Send response
    res.status(200).json({ message: "Routine created successfully", created, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating routine" });
  }
}



//*******      delete   ***** */
exports.delete = async (req, res) => {
  const { id } = req.params;


  try {

    // Delete the routine
    await Routine.findByIdAndRemove(id);

    res.status(200).json({ message: "Routine deleted successfully" });


  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting routine" });
  }
}



exports.allRutin = async (req, res) => {
  console.log(req.user);

  const userid = req.user.id;

  try {


    const user = await Account.findOne({ _id: userid }).populate([
      {
        path: 'routines',
        select: 'name ownerid class priode last_summary',
        options: {
          sort: { createdAt: -1 }
        },

        populate: {
          path: 'ownerid',
          select: 'name username image'
        }
      },
      {
        path: 'Saved_routines',
        select: 'name ownerid class',
        options: {
          sort: { createdAt: -1 }
        },
        populate: {
          path: 'ownerid',
          select: 'name username image'
        }
      }
    ]);
    if (!user) return res.status(404).json({ message: "User not found" });



    res.status(200).json({ user, });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting routines" });
  }
};


//********** save rutin   ************* */
exports.add_to_save_routine = async (req, res) => {
  const { rutin_id } = req.params;
  const ownerid = req.user.id;

  try {
    // 1. Find the routine
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });


    // 2. Find the user
    const user = await Account.findById(ownerid);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 3. Check if routine is already saved
    if (user.Saved_routines.includes(routine._id)) {
      return res.status(200).json({ message: "Routine already saved", save: true });
    }

    // 4. Push the routine ID into the saved_routines array
    user.Saved_routines.push(routine._id);
    await user.save();

    // Send response
    res.status(200).json({ message: "Routine saved successfully", save: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving routine" });
  }
};









//.... unsave rutin 
exports.unsave_routine = async (req, res) => {
  const { rutin_id } = req.params;
  const ownerid = req.user.id;

  try {
    // 1. Find the routine
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });


    // 2. Find the user
    const user = await Account.findById(ownerid);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 3. Check if routine is already saved
    if (!user.Saved_routines.includes(routine._id)) {
      return res.status(400).json({ message: "Routine not saved" });
    }

    // 4. Remove the routine ID from the saved_routines array
    user.Saved_routines.pull(routine._id);
    await user.save();

    // Send response
    res.status(200).json({ message: "Routine unsaved successfully", save: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error unsaving routine" });
  }
};


///.... chack save or not
exports.save_checkout = async (req, res) => {
  const { rutin_id } = req.params;
  const ownerid = req.user.id;

  try {
    // 1. Find the routine
    const routine = await Routine.findById(rutin_id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });


    // 2. Find the user
    const user = await Account.findOne({ ownerid });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 3. Check if routine is already saved
    let isSaved;
    isOwner = false;
    if (user.Saved_routines.includes(routine._id)) {
      isSaved = true;
    }

    if (!user.Saved_routines.includes(routine._id)) {
      isSaved = false;

    }

    // chack is owner is not
    if (routine.ownerid.toString() == req.user.id) { isOwner = true; };




    // Send response
    res.status(200).json({ message: "Routine saved conditon", save: isSaved, isOwner, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving routine" });
  }
};





//********** Search rutins    ************* */

exports.search_rutins = async (req, res) => {
  const { src } = req.params;

  try {



    const rutins = await Routine.find({ name: { $regex: src, $options: "i" } })
      .select("-createdAt -class -updatedAt -priode -sunday -cap10s -__v")
      .populate({
        path: "ownerid",
        select: "_id name username image"
      });

    if (!rutins) return res.send({ message: "not Found", });

    res.send({ message: " Found", rutins })


  } catch (error) {
    res.send({ message: e.message })

  }

}



//.......  /save_rutins.../
exports.save_rutins = async (req, res) => {
  const { username } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;

  try {
    // Find the account by primary username
    const account = await Account.findOne({ username: username || req.user.username });
    if (!account) return res.status(404).json({ message: "Account not found" });

    // Find the saved routines for the account and populate owner details
    const savedRoutines = await Routine.find({ _id: { $in: account.Saved_routines } })
      .select("_id name last_summary ownerid")
      .populate({ path: "ownerid", select: "name username image" })
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Routine.countDocuments({ _id: { $in: account.Saved_routines } });


    res.status(200).json({
      savedRoutines,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.send({ message: error.message });
  }
};





//**************  uploaded_rutins     *********** */
exports.uploaded_rutins = async (req, res) => {
  const { username } = req.params;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;

  try {
    const findAccount = await Account.findOne({ username: username || req.user.username })
    if (!findAccount) return res.status(404).json({ message: "Account not found" });

    const count = await Routine.countDocuments({ ownerid: findAccount._id });

    const rutins = await Routine.find({ ownerid: findAccount._id })
      .select("name ownerid last_summary")
      .populate({ path: 'ownerid', select: 'name image username' })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!rutins) return res.status(404).json({ message: "rutins not found" });

    res.status(200).json({
      rutins,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });

  } catch (error) {
    res.send({ message: error.message });
  }
}
