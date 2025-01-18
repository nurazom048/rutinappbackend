import express, { Request, Response } from 'express';
//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const firebase_storage = require("../../../config/firebase/firebase_storage");
initializeApp(firebase_storage.firebaseConfig); // Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();
// prisma
import prisma from '../../../prisma/schema/prisma.clint';
import { imageStorageProvider } from '@prisma/client';
import { summaryImageUploader } from '../firebase/routines.firebase';
//
//
//
//*********************************************************************************/
//--------------------------- -add summary  --------------------------------------/
//********************************************************************************/
// Helper function to check file MIME types and upload summaries
export const addSummary = async (req: any, res: Response) => {
  const { message, checkedType } = req.body;
  const { classID } = req.params;
  const { id } = req.user;
  const { routineID } = req;

  try {
    let imageStorageProvider: imageStorageProvider | null = null;

    // Step 1: Upload images to Firebase Storage
    const downloadUrls = await summaryImageUploader({
      files: req.files,
      classId: classID,
      routineID,
    });

    // Determine image storage provider if images are uploaded
    if (downloadUrls.length > 0) {
      imageStorageProvider = 'firebase';
    }

    // Step 2: Perform database operations in a transaction
    const createdSummary = await prisma.$transaction(async (tx) => {
      const summary = await tx.summary.create({
        data: {
          ownerId: id,
          text: message?.trim() === "" && downloadUrls.length > 0 ? '' : message,
          imageLinks: downloadUrls,
          imageStorageProvider,
          routineId: routineID,
          classId: classID,
        },
      });

      // Update routine's updatedAt field
      await tx.routine.update({
        where: { id: routineID },
        data: { updatedAt: new Date() },
      });

      return summary;
    });

    // Step 3: Send success response
    return res.status(201).json({
      message: 'Summary created successfully',
      summary: createdSummary,
    });
  } catch (error: any) {
    console.error('Error creating summary:', error);
    return res.status(500).json({ message: 'Server error occurred' });
  }
};


//***************************************************************************************/
//--------------------------- -Get class summary list  ----------------------------------/
//**************************************************************************************/

//## Here you can get saved summary or summary by class ID// Fetch and list class summaries or saved summaries for an account
export const get_class_summary_list = async (req: any, res: Response) => {
  const { classID } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    let summaries: any[] = [];
    let totalCount = 0;

    // Helper function to remove fields with null values
    const removeNullFields = (data: any) =>
      JSON.parse(JSON.stringify(data, (key, value) => (value === null ? undefined : value)));

    if (!classID) {
      // Fetch saved summaries for the logged-in account
      const account = await prisma.account.findUnique({
        where: { id: req.user.id },
        select: {
          saveSummary: {
            select: {
              id: true,
              text: true,
              imageLinks: true,
              createdAt: true,
              routineId: true,
              class: { select: { id: true, name: true, instructorName: true } },
              owner: { select: { id: true, username: true, name: true, image: true } },
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
          },
        },
      });

      totalCount = await prisma.summary.count({ where: { savedAccountId: req.user.id } });
      summaries = account?.saveSummary?.map(removeNullFields) ?? [];
    } else {
      // Fetch summaries for a specific class
      const classInstance = await prisma.class.findUnique({ where: { id: classID } });
      if (!classInstance) return res.status(404).json({ message: "Class not found" });

      totalCount = await prisma.summary.count({ where: { classId: classID } });

      summaries = await prisma.summary.findMany({
        where: { classId: classID },

        include: {
          owner: { select: { id: true, username: true, name: true, image: true } },
          class: { select: { id: true, name: true, instructorName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });

      summaries = summaries.map(removeNullFields);
    }

    return res.status(200).json({
      message: classID ? "Summaries fetched successfully" : "Saved summaries fetched successfully",
      summaries,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit)),
      totalCount,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "An error occurred" });
  }
};




//************* SUMMARY STATUS ********************/
export const summary_status = async (req: any, res: Response) => {
  try {
    const { summaryID } = req.params;
    const { id: userId } = req.user;

    if (!summaryID || !userId) {
      return res.status(400).json({ message: "Missing required parameters." });
    }

    // Fetch summary and related routine details
    const foundSummary = await prisma.summary.findUnique({
      where: { id: summaryID },
      include: { routine: true },
    });

    if (!foundSummary) return res.status(404).json({ message: "Summary not found." });

    const { ownerId, routineId } = foundSummary;

    // Determine user roles and permissions
    const routineMember = await prisma.routineMember.findFirst({
      where: { routineId, accountId: userId },
    });

    const summaryOwner = ownerId === userId;
    const isOwner = routineMember?.owner ?? false;
    const isCaptain = routineMember?.captain ?? false;

    // Check if the summary is saved by the user
    const isSummarySaved = Boolean(
      await prisma.summary.findFirst({
        where: { id: summaryID, savedAccountId: userId },
      })
    );

    // Response with status and roles
    return res.status(200).json({
      summaryOwner,
      isOwner,
      isCaptain,
      isSummarySaved,
    });
  } catch (error) {
    console.error("Error in summary_status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//*************************************************************************************/
//--------------------------------- saveUnsaveSummary ----------------------------------/
//*************************************************************************************/
export const saveUnsaveSummary = async (req: any, res: Response) => {
  try {
    const { save, summaryId } = req.body;
    const { id } = req.user;

    // Find the summary by ID
    const foundSummary = await prisma.summary.findUnique({
      where: { id: summaryId },
    });

    if (!foundSummary) {
      return res.status(404).json({ message: 'Summary not found' });
    }


    switch (save) {
      case 'true':
        // Check if the summary is already saved by the user
        const isSaved = await prisma.account.findFirst({
          where: {
            id: id, // Make sure to use the user's ID
            saveSummary: {
              some: { id: summaryId }, // Check if summary is in the saveSummary relation
            },
          },
        });

        if (isSaved) {
          return res.status(409).json({ message: 'Summary already saved' });
        }

        // Create a new SaveSummary document
        await prisma.account.update({
          where: { id: id },
          data: {
            saveSummary: {
              connect: { id: summaryId }, // Connect the saved summary to the account
            },
          },
        });

        return res.status(200).json({
          message: 'Summary saved successfully',
          save: true,
        });

      case 'false':
        // Check if the summary is saved by the user
        const ifSaved = await prisma.account.findFirst({
          where: {
            id: req.user.id,
            saveSummary: {
              some: { id: summaryId },
            },
          },
        });

        if (!ifSaved) {
          return res.status(404).json({ message: 'Saved summary not found' });
        }

        // Remove the saved summary
        await prisma.account.update({
          where: { id: id },
          data: {
            saveSummary: {
              disconnect: { id: summaryId }, // Disconnect the saved summary from the account
            },
          },
        });

        return res.status(200).json({
          message: 'Summary unsaved successfully',
          save: false,
        });

      default:
        return res.status(400).json({ message: 'Save condition is required' });
    }
  } catch (error: any) {
    console.error('Error:', error); // Add logging for debugging
    return res.status(500).json({ message: error.message });
  }
};

//*************************************************************************************/
//--------------------------------- Remove Summary ----------------------------------/
//*************************************************************************************/

export const removeSummary = async (req: any, res: Response) => {
  const { summaryID } = req.params;
  const findSummary = req.findSummary; // Use the summary data from middleware

  try {
    // Transaction: Delete save records and remove the summary
    await prisma.$transaction(async (tx) => {
      // Delete the summary record
      await tx.summary.delete({ where: { id: summaryID } });
    });

    // Remove images from Firebase storage if any exist
    for (const imageLink of findSummary.imageLinks ?? []) {
      const fileRef = ref(storage, imageLink);
      await deleteObject(fileRef);
    }

    return res.status(200).json({ message: "Summary deleted successfully." });

  } catch (error: any) {
    console.error("Error in remove_summary handler:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};
