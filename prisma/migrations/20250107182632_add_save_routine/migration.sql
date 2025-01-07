-- CreateTable
CREATE TABLE "_AccountSavedRoutines" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AccountSavedRoutines_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AccountSavedRoutines_B_index" ON "_AccountSavedRoutines"("B");

-- AddForeignKey
ALTER TABLE "_AccountSavedRoutines" ADD CONSTRAINT "_AccountSavedRoutines_A_fkey" FOREIGN KEY ("A") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountSavedRoutines" ADD CONSTRAINT "_AccountSavedRoutines_B_fkey" FOREIGN KEY ("B") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
