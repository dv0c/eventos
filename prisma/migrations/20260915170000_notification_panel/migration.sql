-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MEDIA_PENDING';
ALTER TYPE "NotificationType" ADD VALUE 'COLLAB_INVITE';
ALTER TYPE "NotificationType" ADD VALUE 'ORG_INVITE';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_ENDING_SOON';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_STOPPED';
ALTER TYPE "NotificationType" ADD VALUE 'MEDIA_PURGE_SOON';
ALTER TYPE "NotificationType" ADD VALUE 'SONG_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'VOICE_WISH';
ALTER TYPE "NotificationType" ADD VALUE 'PANIC_ARMED';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "eventId" TEXT;
ALTER TABLE "notifications" ADD COLUMN "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
CREATE INDEX "notifications_eventId_idx" ON "notifications"("eventId");
CREATE INDEX "notifications_organizationId_idx" ON "notifications"("organizationId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
