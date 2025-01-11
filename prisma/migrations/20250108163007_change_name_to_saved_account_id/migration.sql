-- Step 1: Back up the data from the `accountId` column into a temporary table
CREATE TABLE "Summary_accountId_backup" AS
SELECT "id", "accountId"
FROM "Summary"
WHERE "accountId" IS NOT NULL;

-- Step 2: Drop the foreign key constraint
ALTER TABLE "Summary" DROP CONSTRAINT "Summary_accountId_fkey";

-- Step 3: Alter the `Summary` table
-- Remove the `accountId` column and add the `savedAccountId` column
ALTER TABLE "Summary" DROP COLUMN "accountId",
ADD COLUMN "savedAccountId" TEXT;

-- Step 4: Restore the backed-up data into the new `savedAccountId` column
UPDATE "Summary"
SET "savedAccountId" = (SELECT "accountId" FROM "Summary_accountId_backup" WHERE "Summary_accountId_backup"."id" = "Summary"."id");

-- Step 5: Add the foreign key constraint to the new `savedAccountId` column
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_savedAccountId_fkey"
FOREIGN KEY ("savedAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Clean up the temporary backup table
DROP TABLE "Summary_accountId_backup";

