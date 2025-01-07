-- AlterTable
ALTER TABLE "Routine" ADD COLUMN     "accountId" TEXT;

-- CreateTable
CREATE TABLE "RoutinesJoinRequest" (
    "id" TEXT NOT NULL,
    "requestMessage" TEXT,
    "routineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountIdBy" TEXT NOT NULL,

    CONSTRAINT "RoutinesJoinRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoutinesJoinRequest" ADD CONSTRAINT "RoutinesJoinRequest_accountIdBy_fkey" FOREIGN KEY ("accountIdBy") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutinesJoinRequest" ADD CONSTRAINT "RoutinesJoinRequest_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
