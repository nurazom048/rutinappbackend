/*
  Warnings:

  - Made the column `publisherId` on table `Notice` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Notice" ALTER COLUMN "publisherId" SET NOT NULL;
