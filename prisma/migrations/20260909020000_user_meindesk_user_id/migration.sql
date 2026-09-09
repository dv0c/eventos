-- AlterTable
ALTER TABLE "users" ADD COLUMN "meindeskUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_meindeskUserId_key" ON "users"("meindeskUserId");
