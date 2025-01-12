-- CreateTable
CREATE TABLE "NoticeBoardMember" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "notificationOn" BOOLEAN NOT NULL DEFAULT false,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "NoticeBoardMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pdf" TEXT,
    "description" TEXT,
    "publisherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rePublish" (
    "id" TEXT NOT NULL,
    "republishedTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "noticeId" TEXT,
    "rePublisherId" TEXT NOT NULL,

    CONSTRAINT "rePublish_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NoticeBoardMember" ADD CONSTRAINT "NoticeBoardMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rePublish" ADD CONSTRAINT "rePublish_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rePublish" ADD CONSTRAINT "rePublish_rePublisherId_fkey" FOREIGN KEY ("rePublisherId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
