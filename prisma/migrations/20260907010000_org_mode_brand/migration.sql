-- CreateEnum
CREATE TYPE "OrgMode" AS ENUM ('B2C', 'B2B');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "mode" "OrgMode" NOT NULL DEFAULT 'B2C';
ALTER TABLE "organizations" ADD COLUMN "brandName" TEXT;
