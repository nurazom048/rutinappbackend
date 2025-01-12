/*
  Warnings:

  - You are about to drop the column `email` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `googleSignIn` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Account` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `AccountData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `AccountData` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `AccountData` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Account_email_key";

-- DropIndex
DROP INDEX "Account_phone_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "email",
DROP COLUMN "googleSignIn",
DROP COLUMN "password",
DROP COLUMN "phone",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AccountData" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "googleSignIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oneSignalUserId" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "verificationDocuments" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "AccountData_email_key" ON "AccountData"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AccountData_phone_key" ON "AccountData"("phone");
