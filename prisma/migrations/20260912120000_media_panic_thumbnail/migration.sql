-- AlterTable
ALTER TABLE "events" ADD COLUMN "mediaPanicAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "media" ADD COLUMN "thumbnailKey" TEXT;
