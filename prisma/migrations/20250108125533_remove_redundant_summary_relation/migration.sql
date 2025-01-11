-- CreateTable
CREATE TABLE "_SavedSummaries" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SavedSummaries_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SavedSummaries_B_index" ON "_SavedSummaries"("B");

-- AddForeignKey
ALTER TABLE "_SavedSummaries" ADD CONSTRAINT "_SavedSummaries_A_fkey" FOREIGN KEY ("A") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SavedSummaries" ADD CONSTRAINT "_SavedSummaries_B_fkey" FOREIGN KEY ("B") REFERENCES "Summary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
