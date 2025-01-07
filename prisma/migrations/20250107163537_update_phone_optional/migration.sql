/*
  Warnings:

  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AccountData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Class` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Routine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoutineMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Weekday` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccountData" DROP CONSTRAINT "AccountData_ownerAccountId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_routineId_fkey";

-- DropForeignKey
ALTER TABLE "Routine" DROP CONSTRAINT "Routine_ownerAccountId_fkey";

-- DropForeignKey
ALTER TABLE "RoutineMember" DROP CONSTRAINT "RoutineMember_accountId_fkey";

-- DropForeignKey
ALTER TABLE "RoutineMember" DROP CONSTRAINT "RoutineMember_routineId_fkey";

-- DropForeignKey
ALTER TABLE "Weekday" DROP CONSTRAINT "Weekday_classId_fkey";

-- DropForeignKey
ALTER TABLE "Weekday" DROP CONSTRAINT "Weekday_routineId_fkey";

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "AccountData";

-- DropTable
DROP TABLE "Class";

-- DropTable
DROP TABLE "Routine";

-- DropTable
DROP TABLE "RoutineMember";

-- DropTable
DROP TABLE "Weekday";

-- DropEnum
DROP TYPE "AccountType";

-- DropEnum
DROP TYPE "Day";

-- DropEnum
DROP TYPE "imageStorageProvider";
