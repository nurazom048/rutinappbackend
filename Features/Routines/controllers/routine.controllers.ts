import express, { Request, Response } from 'express';

// Models
import Routine from '../models/routine.models';
import prisma from '../../../prisma/schema/prisma.clint';


//! firebase
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
const firebase_storage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_storage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();


// routine firebase
import { deleteSummariesFromFirebaseBaseOnRoutineID } from '../firebase/summary.firebase';
import { getClasses } from '../helper/class.helper';

//*******************************************************************************/
//--------------------------------- createRoutine  ------------------------------/
//*******************************************************************************/

export const createRoutine = async (req: any, res: Response) => {
  const { name } = req.body;
  const ownerId = req.user?.id; // Ensure `req.user` is populated with authenticated user details

  if (!name || !ownerId) {
    return res.status(400).json({ message: "Routine name and ownerId are required" });
  }

  try {
    // Start transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Step 1: Check if a routine with the same name and owner already exists


      const existingRoutine = await prisma.routine.findFirst({
        where: {
          routineName: name,
          routineOwner: { id: ownerId },
        },
      });

      if (existingRoutine) {
        throw new Error("Routine already created with this name");
      }

      // Step 2: Create a new routine
      const createdRoutine = await prisma.routine.create({
        data: {
          routineName: name,
          routineOwner: {
            connect: { id: ownerId },
          },
        },
      });

      // Step 3: Create a new RoutineMember instance
      const routineMember = await prisma.routineMember.create({
        data: {
          routineId: createdRoutine.id,
          accountId: ownerId,
          owner: true,
        },
      });

      // Step 4: Update the user's routines list (optional, based on schema)
      const updatedUser = await prisma.account.update({
        where: { id: ownerId },
        data: {
          createdRoutines: { connect: { id: createdRoutine.id } },
        },
      });

      // Return all results
      return {
        createdRoutine,
        routineMember,
        updatedUser,
      };
    });

    // If transaction completes successfully
    res.status(200).json({
      message: "Routine created successfully",
      routine: result.createdRoutine,
      user: result.updatedUser,
      routineMember: result.routineMember,
    });


  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating routine:", error);
    res.status(500).json({ message: `Routine creation failed: ${message}` });
  }
}
//*******************************************************************************/
//--------------------------------- deleteRoutine  ------------------------------/
//*******************************************************************************/

export const deleteRoutine = async (req: any, res: Response) => {
  const { id } = req.params;  // Routine ID from request parameters
  const ownerId = req.user?.id; // Ensure `req.user` is populated with authenticated user details

  if (!id || !ownerId) {
    return res.status(400).json({ message: "Routine ID and ownerId are required" });
  }

  try {
    // Start transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Step 1: Check if the routine exists and belongs to the user
      const existingRoutine = await prisma.routine.findFirst({
        where: {
          id,
          routineOwner: { id: ownerId },
        },
      });

      if (!existingRoutine) {
        throw new Error("Routine not found or you are not the owner");
      }

      // Step 2: Delete the related routine members
      await prisma.routineMember.deleteMany({
        where: {
          routineId: existingRoutine.id,
        },
      });

      // Step 3: Remove the routine from the user's list of created routines
      await prisma.account.update({
        where: { id: ownerId },
        data: {
          createdRoutines: { disconnect: { id: existingRoutine.id } },
        },
      });

      // Step 4: Delete the routine
      const deletedRoutine = await prisma.routine.delete({
        where: { id: existingRoutine.id },
      });

      // Return the deleted routine details
      return deletedRoutine;
    });

    // If transaction completes successfully
    res.status(200).json({
      message: "Routine deleted successfully",
      routine: result,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting routine:", error);
    res.status(500).json({ message: `Routine deletion failed: ${message}` });
  }
};


//*******************************************************************************/
//--------------------------------- search Routine  ------------------------------/
//*******************************************************************************/
export const searchRoutine = async (req: any, res: Response) => {
  const { src } = req.query; // get the search string from the query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (!src) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    const regex = new RegExp(src, "i"); // Case-insensitive regex search pattern

    // Get the count of routines that match the search criteria
    const count = await prisma.routine.count({
      where: {
        OR: [
          { routineName: { contains: src, mode: 'insensitive' } },
          {
            routineOwner: {
              username: { contains: src, mode: 'insensitive' }
            }
          }
        ]
      }
    });

    // Get the routines with pagination
    const routines = await prisma.routine.findMany({
      where: {
        OR: [
          { routineName: { contains: src, mode: 'insensitive' } },
          {
            routineOwner: {
              username: { contains: src, mode: 'insensitive' }
            }
          }
        ]
      },
      select: {
        id: true,
        routineName: true,
        routineOwner: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit
    });

    if (routines.length === 0) {
      return res.status(404).json({ message: "No routines found" });
    }

    res.status(200).json({
      routines,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalCount: count
    });
  } catch (error: any) {
    console.error("Error searching routines:", error);
    res.status(500).json({ message: "An error occurred while searching routines" });
  }
};



//***************************************************************************************/
//--------------------Save and unsave  Routine  &  show save routine --------------------/
//**************************************************************************************/

export const save_and_unsave_routine = async (req: any, res: Response) => {
  const { routineId } = req.params;
  const { saveCondition } = req.body;
  const { id: userId } = req.user;

  // Validate saveCondition
  if (!["true", "false"].includes(saveCondition)) {
    return res.status(400).json({ message: "Invalid saveCondition. Must be 'true' or 'false'." });
  }

  try {
    // Check if routine exists and if it's already saved
    const [routine, isSaved] = await Promise.all([
      prisma.routine.findUnique({ where: { id: routineId } }),
      prisma.account.findFirst({ where: { id: userId, savedRoutines: { some: { id: routineId } } } })
    ]);

    if (!routine) return res.status(404).json({ message: "Routine not found" });

    // If saveCondition is "true" and already saved, return message
    if (saveCondition === "true" && isSaved) {
      return res.status(200).json({ message: "Routine is already saved", save: true });
    }

    // If saveCondition is "false" and not saved, return message
    if (saveCondition === "false" && !isSaved) {
      return res.status(400).json({ message: "Routine is not currently saved" });
    }

    // Save or unsave the routine
    await prisma.account.update({
      where: { id: userId },
      data: {
        savedRoutines: saveCondition === "true"
          ? { connect: { id: routineId } }
          : { disconnect: { id: routineId } }
      },
    });

    const message = saveCondition === "true" ? "Routine saved successfully" : "Routine unsaved successfully";
    return res.status(200).json({ message, save: saveCondition === "true" });
  } catch (error) {
    console.error("Error handling save/unsave routine:", error);
    res.status(500).json({ message: "An error occurred while processing the request." });
  }
};


//.......save routines.../
export const save_routines = async (req: any, res: Response) => {
  const { id } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;

  try {
    // // Find the account by primary username
    // const account = await Account.findById(id);
    // if (!account) return res.status(404).json({ message: "Account not found" });

    // // Find the saved routines for the account and populate owner details
    // const savedRoutines = await SaveRoutine.find({ savedByAccountID: id })
    //   .populate({
    //     path: 'routineID',
    //     select: 'name ownerid',
    //     populate: {
    //       path: 'ownerid',


    //       select: 'name username image'
    //     }
    //   })
    //   .limit(limit)
    //   .skip((page - 1) * limit);

    // // Count the total number of saved routines
    // const count = await SaveRoutine.countDocuments({ savedByAccountID: id });

    // // Prepare response data
    // const response = {
    //   savedRoutines: savedRoutines.map((routine: any) => routine.routineID),
    //   currentPage: page,
    //   totalPages: Math.ceil(count / limit)
    // };

    // res.status(200).json(response);
    // console.log(response);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};



//***************************************************************************************/
//---------------------------- current_user_status --------------------------------------/
//**************************************************************************************/

export const current_user_status = async (req: any, res: Response) => {
  try {
    const { routineId } = req.params;
    const { id } = req.user;



    // Find the routine
    const routine = await prisma.routine.findUnique({
      where: { id: routineId }, // Find routine by ID
      include: {
        routineMembers: true, // Include members for the routine
        RoutinesJoinRequest: true, // Include join requests for the routine
      },
    });

    if (!routine) {
      return res.status(404).json({ message: 'Routine not found' });
    }

    // Get the member count
    const memberCount = routine.routineMembers.length;

    let isOwner = false;
    let isCaptain = false;
    let activeStatus = 'not_joined';
    let isSaved = false;
    let notificationOn = false;

    // Check if the user has saved the routine (savedRoutines relation)
    const savedRoutine = await prisma.account.findUnique({
      where: { id },
      select: {
        savedRoutines: {
          where: { id: routineId }, // Checking if the routine is saved by the user
        },
      },
    });

    // Explicitly check if savedRoutines is not undefined or null
    if (savedRoutine && savedRoutine.savedRoutines && savedRoutine.savedRoutines.length > 0) {
      isSaved = true;
    }

    // Check if the user is a member of the routine (routineMembers relation)
    const routineMember = await prisma.routineMember.findFirst({
      where: {
        routineId,
        accountId: id,
      },
    });

    if (routineMember) {
      activeStatus = 'joined';
      isOwner = routineMember.owner;
      isCaptain = routineMember.captain;
      notificationOn = routineMember.notificationOn;
    }

    // Check if the user has a pending join request (RoutinesJoinRequest relation)
    const pendingRequest = await prisma.routinesJoinRequest.findFirst({
      where: {
        routineId,
        accountIdBy: id,
      },
    });

    if (pendingRequest) {
      activeStatus = 'request_pending';
    }

    // Respond with user status
    console.log({
      isOwner,
      isCaptain,
      activeStatus,
      isSaved,
      memberCount,
      notificationOn,
    });

    res.status(200).json({
      isOwner,
      isCaptain,
      activeStatus,
      isSaved,
      memberCount,
      notificationOn,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing the request.' });
  }
};


///.... joined Routine ......///
export const joined_routine = async (req: any, res: Response) => {
  const { id } = req.user;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1;

  try {
    const count = await Routine.countDocuments({ members: id });

    const routines = await Routine.find({ members: id })
      .select(" name ownerid")
      .populate({
        path: 'ownerid',

        select: 'name image username'
      })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!routines) return res.status(404).json({ message: "No joined routines found" });

    res.status(200).json({
      routines,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving joined routines" });
  }
};


// //************** user can see all routines where owner or joined ***********




export const homeFeed = async (req: any, res: Response) => {
  const { id } = req.user; // Logged-in user's ID
  const { userID } = req.params; // Specific user ID to filter by (if provided)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;

  try {
    // Build the query for routines based on whether a userID is provided
    const query = userID
      ? { accountId: userID, owner: true } // Use accountId instead of memberID
      : { OR: [{ accountId: id }, { owner: true }] }; // Correct field names

    // Calculate the skip value for pagination
    const skip = (page - 1) * limit;

    // Find routines and include related routine details (Populate RutineID)
    const routines = await prisma.routineMember.findMany({
      where: query,
      skip,
      take: limit,
      include: {
        routine: { // Include the associated routine and select the desired fields
          select: {
            id: true, // Get the id of the routine
            routineName: true // Get the name of the routine
          }
        }
      }
    });

    // Get the total count of routines matching the query for pagination
    const totalCount = await prisma.routineMember.count({ where: query });

    // Respond with the filtered and formatted routine data
    res.status(200).json({
      message: 'success',
      homeRoutines: routines.map(routine => ({
        memberID: routine.accountId,
        RutineID: routine.routine, // Now RutineID is populated with routine object (id, name)
        notificationOn: routine.notificationOn,
        captain: routine.captain,
        owner: routine.owner,
        isSaved: false, // Modify based on your logic for "saved"
        blocklist: false, // Modify based on your blocklist logic
      })),
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


// export const homeFeed = async (req: any, res: Response) => {
//   const { id } = req.user;
//   const { userID } = req.params;
//   const { osUserID } = req.body;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 3;

//   try {
//     // Find routines where the user is the owner or a member and Routine ID exists and is not null
//     let query;

//     if (userID) {
//       // This query is for to find all the uploaded routine on a specific user
//       query = { memberID: userID, owner: true };
//     }
//     // This query is for to find all the home routine of logged in user
//     query = { memberID: userID || id };
//     // Calculate the number of documents to skip
//     const skip = (page - 1) * limit;
//     // console.log(query);
//     // console.log(userID);

//     // Find all matching routines
//     const routines = await RoutineMember.find(query, '-_id -__v')
//       .populate({
//         path: 'RutineID',
//         select: 'name'
//       })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     //  console.log(routines);

//     // Get the IDs of routines with null RutineID
//     // const nullRutineIDIds = routines
//     //   .filter(routine => routine.RutineID === null || routine.RutineID === undefined || routine.RutineID === '')
//     //   .map(routine => routine._id);
//     const nullRutineIDIds: string[] = routines
//       .filter((routine: any) => routine.RutineID === null || routine.RutineID === undefined || routine.RutineID === '')
//       .map((routine: any) => routine._id);
//     //  console.log(nullRutineIDIds);

//     // Remove the objects with null RutineID from MongoDB
//     await RoutineMember.deleteMany({ _id: { $in: nullRutineIDIds } });

//     // Filter out the objects with null RutineID from the response
//     //const filteredRoutines = routines.filter(routine => routine.RutineID !== null);
//     const filteredRoutines: any[] = routines.filter((routine: any) => routine.RutineID);

//     // Get the total count of matching routines
//     const totalCount = await RoutineMember.countDocuments(query);

//     if (page == 1 && !userID) {
//       const updated = await Account.findByIdAndUpdate(req.user.id, { osUserID: osUserID }, { new: true });
//       // console.log(updated)
//     }
//     // console.log({
//     //   message: 'success',
//     //   homeRoutines: filteredRoutines,
//     //   currentPage: page,
//     //   totalPages: Math.ceil(totalCount / limit),
//     //   totalItems: totalCount,
//     // })
//     res.status(200).json({
//       message: 'success',
//       homeRoutines: filteredRoutines,
//       currentPage: page,
//       totalPages: Math.ceil(totalCount / limit),
//       totalItems: totalCount,
//     });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };
