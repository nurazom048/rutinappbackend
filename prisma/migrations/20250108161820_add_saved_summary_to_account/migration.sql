-- Step 1: Backup data from `_SavedSummaries` table
CREATE TABLE "_SavedSummaries_backup" AS TABLE "_SavedSummaries";

-- Step 2: Add the new column to the `Summary` table
ALTER TABLE "Summary" ADD COLUMN "accountId" TEXT;

-- Step 3: Migrate data from `_SavedSummaries_backup` to `Summary` table
-- Assuming `_SavedSummaries` has columns "A" (Summary ID) and "B" (Account ID),
-- map them to the corresponding columns in `Summary` and `Account`.
INSERT INTO "Summary" ("id", "accountId")
SELECT "A", "B" FROM "_SavedSummaries_backup";

-- Step 4: Add the foreign key constraint to `Summary`
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_accountId_fkey" 
FOREIGN KEY ("accountId") REFERENCES "Account"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: Drop the `_SavedSummaries` table after ensuring data is migrated
DROP TABLE "_SavedSummaries";
