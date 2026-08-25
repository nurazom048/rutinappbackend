import { Request, Response } from 'express';
import prisma from '../../../prisma/schema/prisma.clint';
import { deleteFile, BUCKET_NAME } from '../../../services/storage/storage';

// ==========================================
// 🌐 GLOBAL ROUTINE ACTIONS
// ==========================================

/**
 * GET /
 * Handles Global Feed, Search, Saved Routines, and User-specific Routines.
 * Query Params: ?search=... | ?type=saved | ?username=...
 */
export const listRoutines = async (req: any, res: Response) => {
  const { search, type, username, page = 1, limit = 10 } = req.query;
  const userId = req.user?.id || (req.isGuest ? null : undefined);

  try {
    let whereClause: any = {};

    if (search) {
      whereClause.routineName = { contains: String(search), mode: 'insensitive' };
    }

    if (type === 'saved' && userId) {
      whereClause.savedBy = { some: { id: userId } };
    }

    if (username) {
      whereClause.routineOwner = { username: String(username) };
    }

    // If no specific query is provided and user is logged in, show their routines (joined/created)
    if (!search && !type && !username && userId) {
      const joinedRoutineIds = await prisma.routineMember.findMany({
        where: { accountId: userId },
        select: { routineId: true },
      });
      const routineIdList = joinedRoutineIds.map(({ routineId }) => routineId);
      whereClause.id = { in: routineIdList };
    }

    const routines = await prisma.routine.findMany({
      where: whereClause,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        routineOwner: {
          select: { id: true, name: true, username: true, image: true, isVerified: true }
        },
        _count: {
          select: { routineMembers: true, savedBy: true, classes: true, exams: true }
        }
      }
    });

    const totalCount = await prisma.routine.count({ where: whereClause });

    const formattedRoutines = routines.map(routine => ({
      id: routine.id,
      routineName: routine.routineName,
      routineType: routine.routineType ?? 'CLASS',
      about: routine.about ?? null,
      ownerAccountId: routine.ownerAccountId, // Explicitly pass the ID
      routineOwner: routine.routineOwner,     // Match the Dart model key
      isOwner: userId === routine.ownerAccountId, // Populated owner status indicator
      createdAt: routine.createdAt,
      stats: {
        totalMembers: routine._count.routineMembers,
        totalSaved: routine._count.savedBy,
        totalClasses: routine._count.classes,
        totalExams: routine._count.exams,
      }
    }));

    res.status(200).json({
      message: "Routines fetched successfully",
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit)),
      totalCount,
      routines: formattedRoutines
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while fetching routines", error: error.message });
  }
};

export const createRoutine = async (req: any, res: Response) => {
  const { name, routineType = 'CLASS', about } = req.body;
  const ownerId = req.user?.id;

  if (!name || !ownerId) return res.status(400).json({ message: "Routine name and ownerId are required" });

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: "Routine name must be a valid non-empty string" });
  }

  if (name.trim().length > 150) {
    return res.status(400).json({ message: "Routine name cannot exceed 150 characters" });
  }

  try {
    const formattedType = String(routineType).toUpperCase() === 'EXAM' ? 'EXAM' : 'CLASS';

    // 🔒 Double-Protection: Only ACADEMY account type can create EXAM routine
    if (formattedType === 'EXAM') {
      const userAccount = await prisma.account.findUnique({
        where: { id: ownerId },
        select: { accountType: true },
      });

      if (!userAccount || String(userAccount.accountType).toLowerCase() !== 'academy') {
        return res.status(403).json({
          message: "Only Academy accounts are authorized to create Exam routines."
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingRoutine = await tx.routine.findFirst({
        where: { routineName: name, routineOwner: { id: ownerId } },
      });

      if (existingRoutine) throw new Error("Routine already created with this name");

      const createdRoutine = await tx.routine.create({
        data: {
          routineName: name,
          routineType: formattedType as any,
          about: about ?? null,
          routineOwner: { connect: { id: ownerId } }
        },
      });

      const routineMember = await tx.routineMember.create({
        data: { routineId: createdRoutine.id, accountId: ownerId, owner: true },
      });

      const updatedUser = await tx.account.update({
        where: { id: ownerId },
        data: { createdRoutines: { connect: { id: createdRoutine.id } } },
      });

      return { createdRoutine, routineMember, updatedUser };
    });

    res.status(201).json({
      message: "Routine created successfully",
      routine: result.createdRoutine,
      user: result.updatedUser,
      routineMember: result.routineMember,
    });
  } catch (error: any) {
    console.error("Error creating routine:", error);
    res.status(500).json({ message: `Routine creation failed: ${error.message || "Unknown error"}` });
  }
};

// ==========================================
// 🎯 SPECIFIC ROUTINE ACTIONS
// ==========================================

export const current_user_status = async (req: any, res: Response) => {
  try {
    const routineId = req.params.routineId || req.params.routineID || req.body?.routineId || req.body?.routineID;

    if (!routineId) return res.status(400).json({ message: 'Routine ID is required in URL parameters' });

    if (req.isGuest) {
      const routine = await prisma.routine.findUnique({
        where: { id: routineId },
        include: { routineMembers: true }
      });
      return res.status(200).json({
        isOwner: false, isCaptain: false, activeStatus: 'not_joined',
        isSaved: false, memberCount: routine ? routine.routineMembers.length : 0, notificationOn: false,
      });
    }

    const id = req.user?.id;
    if (!id) {
      return res.status(200).json({
        isOwner: false, isCaptain: false, activeStatus: 'not_joined',
        isSaved: false, memberCount: 0, notificationOn: false,
      });
    }

    // Process updates if body contains payload (POST requests for save/unsave or notification toggle)
    if (req.body) {
      const { saveCondition, isSaved: bodyIsSaved, notificationOn: bodyNotificationOn, status } = req.body;

      // 1. Handle Save / Unsave state updates
      if (saveCondition !== undefined || bodyIsSaved !== undefined) {
        let targetSaveState: boolean;
        if (saveCondition !== undefined && saveCondition !== null) {
          targetSaveState = String(saveCondition) === "true";
        } else {
          targetSaveState = Boolean(bodyIsSaved);
        }

        await prisma.account.update({
          where: { id },
          data: {
            savedRoutines: targetSaveState
              ? { connect: { id: routineId } }
              : { disconnect: { id: routineId } }
          },
        });
      }

      // 2. Handle Notification On / Off state updates
      if (bodyNotificationOn !== undefined || status !== undefined) {
        let targetNotifState: boolean;
        if (bodyNotificationOn !== undefined) {
          targetNotifState = Boolean(bodyNotificationOn);
        } else {
          targetNotifState = status === 'on' || status === true;
        }

        const member = await prisma.routineMember.findFirst({
          where: { accountId: id, routineId }
        });

        if (member) {
          await prisma.routineMember.update({
            where: { id: member.id },
            data: { notificationOn: targetNotifState }
          });
        }
      }
    }

    // Retrieve and return unified status object response
    const routine = await prisma.routine.findUnique({
      where: { id: routineId },
      include: { routineMembers: true, RoutinesJoinRequest: true },
    });

    if (!routine) return res.status(404).json({ message: 'Routine not found' });

    let activeStatus = 'not_joined';
    let isSaved = false;

    const savedRoutine = await prisma.account.findUnique({
      where: { id },
      select: { savedRoutines: { where: { id: routineId } } },
    });

    if ((savedRoutine?.savedRoutines?.length ?? 0) > 0) isSaved = true;

    const routineMember = await prisma.routineMember.findFirst({
      where: { routineId, accountId: id },
    });

    if (routineMember) activeStatus = 'joined';

    const pendingRequest = await prisma.routinesJoinRequest.findFirst({
      where: { routineId, accountIdBy: id },
    });

    if (pendingRequest) activeStatus = 'request_pending';

    res.status(200).json({
      isOwner: routineMember?.owner || false,
      isCaptain: routineMember?.captain || false,
      activeStatus,
      isSaved,
      memberCount: routine.routineMembers.length,
      notificationOn: routineMember?.notificationOn || false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing the request.' });
  }
};

export const deleteRoutineById = async (req: any, res: Response) => {
  const routineID = req.params.routineID || req.params.routineId;
  const ownerId = req.user?.id;

  if (!routineID || !ownerId) return res.status(400).json({ message: "Routine ID and ownerId are required" });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingRoutine = await tx.routine.findFirst({
        where: { id: routineID, routineOwner: { id: ownerId } },
      });

      if (!existingRoutine) throw new Error("Routine not found or you are not the owner");

      // Delete files of all summaries in this routine from the bucket storage
      const summaries = await tx.summary.findMany({
        where: { routineId: routineID }
      });
      for (const summary of summaries) {
        for (const imageLink of summary.imageLinks ?? []) {
          try {
            await deleteFile(BUCKET_NAME, imageLink);
          } catch (e) { console.error("Could not delete file from storage", e); }
        }
      }

      await tx.routineMember.deleteMany({ where: { routineId: existingRoutine.id } });
      const deletedRoutine = await tx.routine.delete({ where: { id: existingRoutine.id } });

      return deletedRoutine;
    });

    res.status(200).json({ message: "Routine deleted successfully", routine: result });
  } catch (error: any) {
    console.error("Error deleting routine:", error);
    res.status(500).json({ message: `Routine deletion failed: ${error.message || "Unknown error"}` });
  }
};

export const updateRoutine = async (req: any, res: Response) => {
  const routineID = req.params.routineID || req.params.routineId;
  const { name, about } = req.body;
  const userId = req.user?.id;

  if (!routineID || !userId) {
    return res.status(400).json({ message: "Routine ID and user authentication are required" });
  }

  try {
    const routineMember = await prisma.routineMember.findFirst({
      where: { routineId: routineID, accountId: userId },
    });

    if (!routineMember || (!routineMember.owner && !routineMember.captain)) {
      return res.status(403).json({ message: "You do not have permission to edit this routine" });
    }

    const updateData: any = {};

    if (name && typeof name === 'string' && name.trim()) {
      if (name.trim().length > 150) {
        return res.status(400).json({ message: "Routine name cannot exceed 150 characters" });
      }
      updateData.routineName = name.trim();
    }

    if (about !== undefined) {
      if (typeof about === 'string') {
        try {
          updateData.about = JSON.parse(about);
        } catch (_) {
          updateData.about = about;
        }
      } else {
        updateData.about = about;
      }
    }

    const updatedRoutine = await prisma.routine.update({
      where: { id: routineID },
      data: updateData,
    });

    return res.status(200).json({
      message: "Routine updated successfully",
      routine: updatedRoutine,
    });
  } catch (error: any) {
    console.error("Error updating routine:", error);
    return res.status(500).json({ message: `Routine update failed: ${error.message || "Unknown error"}` });
  }
};

// ==========================================
// 🏫 CLASSES & WEEKDAYS
// ==========================================

export const allClass = async (req: any, res: Response) => {
  const routineID = req.params.routineID || req.params.routineId;

  if (!routineID) return res.status(400).json({ message: "Routine ID is required" });

  try {
    const routine = await prisma.routine.findUnique({
      where: { id: routineID },
      include: { routineOwner: { select: { id: true, name: true, username: true, image: true, isVerified: true } } },
    });
    if (!routine) return res.status(404).json({ message: 'Routine not found' });

    const classes = await prisma.class.findMany({
      where: { routineId: routineID },
      select: { id: true, name: true, instructorName: true, subjectCode: true, routineId: true },
    });

    const weekdayClasses: { [key: string]: any[] } = { sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] };

    const classesWithWeekdays = await prisma.class.findMany({
      where: { routineId: routineID },
      include: { weekdays: true },
    });

    classesWithWeekdays.forEach((classItem) => {
      classItem.weekdays.forEach((weekday) => {
        const dayKey = weekday.Day.toLowerCase();
        if (weekdayClasses[dayKey]) {
          weekdayClasses[dayKey].push({
            ...classItem,
            room: weekday.room,
            startTime: weekday.startTime,
            endTime: weekday.endTime,
          });
        }
      });
    });

    const exams = await prisma.exam.findMany({
      where: { routineId: routineID },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    res.status(200).json({
      allClass: classes,
      weekdayClasses,
      exams,
      routineType: routine.routineType ?? 'CLASS',
      owner: routine.routineOwner,
      routineName: routine.routineName,
      about: routine.about ?? null
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const normalizeDayHelper = (d: any): 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' => {
  const s = String(d || '').toLowerCase().trim();
  if (s.startsWith('sun')) return 'sun';
  if (s.startsWith('mon')) return 'mon';
  if (s.startsWith('tue')) return 'tue';
  if (s.startsWith('wed')) return 'wed';
  if (s.startsWith('thu')) return 'thu';
  if (s.startsWith('fri')) return 'fri';
  if (s.startsWith('sat')) return 'sat';
  return 'sun';
};

export const create_class = async (req: any, res: Response) => {
  const { name, subjectCode, instructorName, startTime, endTime, room, weekday, schedules } = req.body;
  const routineId = req.params.routineId || req.params.routineID;

  if (!routineId) return res.status(400).json({ message: "Routine ID is required" });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const createdClass = await tx.class.create({
        data: { name, subjectCode, instructorName, routineId },
      });

      const createdWeekdays = [];

      if (Array.isArray(schedules) && schedules.length > 0) {
        for (const item of schedules) {
          const itemDay = normalizeDayHelper(item.day || item.Day || weekday);
          const itemRoom = String(item.roomNumber || item.room || room);
          const itemStart = new Date(item.startTime || startTime);
          const itemEnd = new Date(item.endTime || endTime);

          const wd = await tx.weekday.create({
            data: {
              class: { connect: { id: createdClass.id } },
              routine: { connect: { id: routineId } },
              Day: itemDay,
              room: itemRoom,
              startTime: itemStart,
              endTime: itemEnd,
            },
          });
          createdWeekdays.push(wd);
        }
      } else {
        const parsedStartTime = new Date(startTime);
        const parsedEndTime = new Date(endTime);
        const formattedWeekday = normalizeDayHelper(weekday);

        const wd = await tx.weekday.create({
          data: {
            class: { connect: { id: createdClass.id } },
            routine: { connect: { id: routineId } },
            Day: formattedWeekday,
            room: String(room),
            startTime: parsedStartTime,
            endTime: parsedEndTime,
          },
        });
        createdWeekdays.push(wd);
      }

      return { createdClass, createdWeekdays };
    });

    console.log({ message: "Class and weekday(s) created successfully:", result });
    res.status(201).json({
      message: "Class and weekday created successfully",
      result: {
        createdClass: result.createdClass,
        createdWeekday: result.createdWeekdays[0]
      }
    });
  } catch (error: any) {
    console.error({ message: "Error creating class and weekday", error });
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const findClass = async (req: any, res: Response) => {
  const { classID } = req.params;

  try {
    const classes = await prisma.class.findFirst({ where: { id: classID } });
    if (!classes) return res.status(404).send({ message: 'Class not found' });

    const weekdays = await prisma.weekday.findMany({ where: { classId: classID } });
    res.status(200).send({ message: "Class details fetched", classes, weekdays });
  } catch (error: any) {
    console.error(error);
    res.status(500).send({ message: 'Error fetching class', weekdays: [] });
  }
};

export const editClass = async (req: any, res: Response) => {
  const { classID } = req.params;
  const { name, instructorName, subjectCode, schedules, weekdays: bodyWeekdays, addWeekdays, removeWeekdayIds } = req.body;

  try {
    const existingClass = await prisma.class.findUnique({ where: { id: classID } });
    if (!existingClass) return res.status(404).json({ message: "Class not found" });

    const updatedClass = await prisma.class.update({
      where: { id: classID },
      data: {
        ...(name && { name }),
        ...(instructorName && { instructorName }),
        ...(subjectCode && { subjectCode }),
      },
    });

    const schedulesList = schedules || bodyWeekdays || addWeekdays;

    if (Array.isArray(schedulesList) && schedulesList.length > 0) {
      await prisma.weekday.deleteMany({ where: { classId: classID } });

      for (const item of schedulesList) {
        const itemDay = normalizeDayHelper(item.day || item.Day);
        const itemRoom = String(item.roomNumber || item.room || '');
        const itemStart = new Date(item.startTime);
        const itemEnd = new Date(item.endTime);

        await prisma.weekday.create({
          data: {
            classId: classID,
            routineId: existingClass.routineId,
            Day: itemDay,
            room: itemRoom,
            startTime: itemStart,
            endTime: itemEnd,
          },
        });
      }
    }

    const updatedWeekdays = await prisma.weekday.findMany({ where: { classId: classID } });

    res.status(200).json({ class: updatedClass, weekdays: updatedWeekdays, message: 'Class updated successfully' });
  } catch (error: any) {
    console.error('Error updating class:', error);
    res.status(500).send({ message: error.message });
  }
};

/**
 * 🦸‍♂️ SUPER UPDATE CLASS
 * Allows updating class details, adding weekdays, and removing weekdays in ONE transaction
 */
export const superUpdateClass = async (req: any, res: Response) => {
  const { classID } = req.params;
  // payload expects: { name, instructorName, subjectCode, addWeekdays: [{day, room, startTime, endTime}], removeWeekdayIds: ["id1", "id2"] }
  const { name, instructorName, subjectCode, addWeekdays = [], removeWeekdayIds = [] } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find existing class to verify it exists and to get the routineId
      const existingClass = await tx.class.findUnique({
        where: { id: classID },
      });

      if (!existingClass) throw new Error("Class not found");

      // 2. Update Class Details
      const updatedClass = await tx.class.update({
        where: { id: classID },
        data: {
          ...(name && { name }),
          ...(instructorName && { instructorName }),
          ...(subjectCode && { subjectCode }),
        },
      });

      // 3. Remove Weekdays
      if (removeWeekdayIds.length > 0) {
        // Ensure we don't delete all weekdays unless intended (optional safety check)
        const currentWeekdayCount = await tx.weekday.count({ where: { classId: classID } });
        if (currentWeekdayCount <= removeWeekdayIds.length && addWeekdays.length === 0) {
          throw new Error("Class must have at least one weekday. Add new weekdays before removing the remaining ones.");
        }

        await tx.weekday.deleteMany({
          where: {
            id: { in: removeWeekdayIds },
            classId: classID // Safety check to ensure they belong to this class
          }
        });
      }

      // 4. Add New Weekdays
      const newlyAddedWeekdays = [];
      if (addWeekdays.length > 0) {
        for (const wd of addWeekdays) {
          const newWd = await tx.weekday.create({
            data: {
              classId: classID,
              routineId: existingClass.routineId,
              Day: wd.day.toLowerCase(),
              room: wd.room,
              startTime: new Date(wd.startTime),
              endTime: new Date(wd.endTime),
            }
          });
          newlyAddedWeekdays.push(newWd);
        }
      }

      // Fetch the final list of weekdays for this class to return to frontend
      const finalWeekdays = await tx.weekday.findMany({ where: { classId: classID } });

      return { class: updatedClass, weekdays: finalWeekdays };
    });

    res.status(200).json({
      message: "Class super updated successfully",
      data: result
    });

  } catch (error: any) {
    console.error("Super update failed:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const remove_class = async (req: any, res: Response) => {
  const { classID } = req.params;

  try {
    const session = await prisma.$transaction(async (tx) => {
      const findClass = await tx.class.findUnique({ where: { id: classID } });
      if (!findClass) throw new Error('Class not found');

      const summaries = await tx.summary.findMany({ where: { classId: classID } });

      for (const summary of summaries) {
        for (const imageLink of summary.imageLinks ?? []) {
          try {
            await deleteFile(BUCKET_NAME, imageLink);
          } catch (e) { console.error("Could not delete file", e); }
        }
        await tx.summary.delete({ where: { id: summary.id } });
      }

      await tx.weekday.deleteMany({ where: { classId: classID } });
      await tx.class.delete({ where: { id: classID } });

      return { message: 'Class deleted successfully' };
    });

    res.send({ message: session.message });
  } catch (error: any) {
    console.error('Error in remove_class:', error);
    res.status(500).send({ message: error.message });
  }
};

export const classNotification = async (req: any, res: Response) => {
  const id = req.user?.id;
  if (!id) {
    return res.status(200).json({ message: 'Guest mode or unauthenticated', notificationOn: false });
  }
  const { routineId, routineID, status } = req.body || {};
  const targetRoutineId = routineId || routineID;

  try {
    // If request contains routineId and status, toggle notificationOn for that routine member
    if (targetRoutineId && status !== undefined) {
      const isNotificationOn = status === 'on' || status === true;

      const member = await prisma.routineMember.findFirst({
        where: { accountId: id, routineId: targetRoutineId }
      });

      if (!member) {
        return res.status(404).json({ message: 'User is not a member of this routine' });
      }

      await prisma.routineMember.update({
        where: { id: member.id },
        data: { notificationOn: isNotificationOn }
      });

      console.log(`🔔 [Notification Toggle] User ${id} set routine ${targetRoutineId} notification to ${isNotificationOn ? 'ON' : 'OFF'} at ${new Date().toISOString()}`);

      return res.status(200).json({
        message: `Notification turned ${isNotificationOn ? 'on' : 'off'} successfully`,
        notificationOn: isNotificationOn,
        notification_Off: !isNotificationOn
      });
    }

    // Otherwise, fetch all classes for enabled routines for notification
    const routineMembers = await prisma.routineMember.findMany({
      where: { accountId: id, notificationOn: true },
      select: { routineId: true },
    });

    if (routineMembers.length === 0) return res.status(200).json({ message: 'No notification routines found', allClassForNotification: [] });

    const routineIds = routineMembers.map((member) => member.routineId);

    const weekdaysWithClasses = await prisma.weekday.findMany({
      where: { routineId: { in: routineIds } },
      include: { class: { select: { id: true, name: true, instructorName: true, subjectCode: true } } },
    });

    const validWeekdays = weekdaysWithClasses.filter((weekday) => weekday.class !== null);

    console.log(`📡 [Notification Fetch] User ${id} requested active notification classes. Returning ${validWeekdays.length} classes at ${new Date().toISOString()}`);

    res.status(200).json({ allClassForNotification: validWeekdays });
  } catch (error: any) {
    console.error('Error in classNotification:', error);
    res.status(500).json({ message: 'Server Error', error: error.message, notificationOnClasses: [] });
  }
};

export const allWeekdayInClass = async (req: any, res: Response) => {
  const { classID } = req.params;

  try {
    if (!classID) return res.status(400).send({ message: "classID not found", weekdays: [] });
    const weekdays = await prisma.weekday.findMany({ where: { classId: classID } });
    res.send({ message: "All weekdays in the class", weekdays });
  } catch (error: any) {
    console.error(error);
    res.status(500).send({ message: error.toString(), weekdays: [] });
  }
};

export const addWeekday = async (req: Request, res: Response) => {
  const classID = req.params.classID as string;
  const { day, room, startTime, endTime } = req.body;

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const classFind = await tx.class.findUnique({ where: { id: classID } });
      if (!classFind) throw new Error('Class not found');

      const parsedStartTime = new Date(startTime);
      const parsedEndTime = new Date(endTime);

      if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
        throw new Error('Invalid startTime or endTime date format');
      }

      const formattedDay = String(day).toLowerCase().trim() as any;

      const newWeekday = await tx.weekday.create({
        data: {
          classId: classID,
          routineId: classFind.routineId,
          Day: formattedDay,
          room: String(room),
          startTime: parsedStartTime,
          endTime: parsedEndTime,
        },
      });

      return newWeekday;
    });

    return res.status(200).json({ message: 'Weekday added successfully', newWeekday: transaction });
  } catch (error: any) {
    console.error('❌ Error adding weekday:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const deleteWeekdayById = async (req: Request, res: Response) => {
  const weekdayID = req.params.weekdayID as string;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const weekday = await tx.weekday.findUnique({
        where: { id: weekdayID },
        select: { id: true, classId: true },
      });

      if (!weekday) throw new Error('Weekday not found');

      const weekdayCount = await tx.weekday.count({ where: { classId: weekday.classId } });
      if (weekdayCount <= 1) throw new Error('Class must have at least one weekday. Deletion not allowed.');

      const deletedWeekday = await tx.weekday.delete({ where: { id: weekdayID } });
      const remainingWeekdays = await tx.weekday.findMany({ where: { classId: weekday.classId } });

      return { deletedWeekday, remainingWeekdays };
    });

    res.status(200).json({
      message: 'Weekday deleted successfully',
      deletedWeekday: result.deletedWeekday,
      weekdays: result.remainingWeekdays,
    });
  } catch (error: any) {
    console.error('Error deleting weekday:', error);
    res.status(500).json({ message: error.message || 'Internal server error', weekdays: [] });
  }
};

// ==========================================
// 📝 EXAM ROUTINE ACTIONS
// ==========================================

const syncRoutineDepartments = async (routineId: string, syllabusJson: any, accountId?: string) => {
  if (!syllabusJson || typeof syllabusJson !== 'object' || !syllabusJson.departments) return;
  const deptKeys = Object.keys(syllabusJson.departments || {});
  if (deptKeys.length === 0) return;

  try {
    const routine = await prisma.routine.findUnique({
      where: { id: routineId },
      select: { departments: true, ownerAccountId: true }
    });
    if (!routine) return;

    const existingDepts = routine.departments || [];
    const newDepts = deptKeys.filter(d => !existingDepts.includes(d));

    if (newDepts.length > 0) {
      await prisma.routine.update({
        where: { id: routineId },
        data: {
          departments: [...existingDepts, ...newDepts]
        }
      });
    }

    // Sync lifetime departments to UserExperience schema (persisted even if routine is deleted)
    const ownerId = accountId || routine.ownerAccountId;
    if (ownerId) {
      const userExp = await prisma.userExperience.findUnique({
        where: { accountId: ownerId }
      });
      const currentExpDepts = userExp?.departments || [];
      const newExpDepts = deptKeys.filter(d => !currentExpDepts.includes(d));

      if (userExp) {
        if (newExpDepts.length > 0) {
          await prisma.userExperience.update({
            where: { accountId: ownerId },
            data: { departments: [...currentExpDepts, ...newExpDepts] }
          });
        }
      } else {
        await prisma.userExperience.create({
          data: {
            accountId: ownerId,
            departments: deptKeys
          }
        });
      }
    }
  } catch (err) {
    console.error("Error syncing routine departments:", err);
  }
};

export const create_exam = async (req: any, res: Response) => {
  const routineId = req.params.routineId || req.params.routineID;
  const { name, subjectCode, price, syllabus, date, startTime, endTime, room } = req.body;

  if (!routineId || !name || !date || !startTime || !endTime) {
    return res.status(400).json({ message: "routineId, name, date, startTime, and endTime are required" });
  }

  const roomVal = room && String(room).trim() !== "" ? String(room).trim() : "TBA";

  try {
    const createdExam = await prisma.exam.create({
      data: {
        name,
        subjectCode: subjectCode || null,
        price: price !== undefined && price !== null ? Number(price) : 0,
        syllabus: syllabus ?? null,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        room: roomVal,
        routineId
      }
    });

    // Automatically sync department choice names to the Routine model
    if (syllabus) {
      await syncRoutineDepartments(routineId, syllabus);
    }

    res.status(201).json({ message: "Exam created successfully", exam: createdExam });
  } catch (error: any) {
    console.error("Error creating exam:", error);
    res.status(500).json({ message: "Failed to create exam", error: error.message });
  }
};

export const allExams = async (req: any, res: Response) => {
  const routineId = req.params.routineId || req.params.routineID;

  if (!routineId) return res.status(400).json({ message: "Routine ID is required" });

  try {
    const exams = await prisma.exam.findMany({
      where: { routineId },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    res.status(200).json({ message: "Exams fetched successfully", exams });
  } catch (error: any) {
    console.error("Error fetching exams:", error);
    res.status(500).json({ message: "Failed to fetch exams", error: error.message });
  }
};

export const edit_exam = async (req: any, res: Response) => {
  const { examId } = req.params;
  const { name, subjectCode, price, syllabus, date, startTime, endTime, room } = req.body;

  try {
    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: {
        ...(name && { name }),
        ...(subjectCode !== undefined && { subjectCode }),
        ...(price !== undefined && { price: Number(price) }),
        ...(syllabus !== undefined && { syllabus }),
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(room && { room: String(room) }),
      }
    });

    res.status(200).json({ message: "Exam updated successfully", exam: updatedExam });
  } catch (error: any) {
    console.error("Error updating exam:", error);
    res.status(500).json({ message: "Failed to update exam", error: error.message });
  }
};

export const remove_exam = async (req: any, res: Response) => {
  const { examId } = req.params;

  try {
    await prisma.exam.delete({ where: { id: examId } });
    res.status(200).json({ message: "Exam deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting exam:", error);
    res.status(500).json({ message: "Failed to delete exam", error: error.message });
  }
};