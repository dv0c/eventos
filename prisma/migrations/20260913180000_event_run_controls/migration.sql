-- AlterTable
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "liveStartedAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "pausedAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "stoppedAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "events_liveStartedAt_idx" ON "events"("liveStartedAt");
CREATE INDEX IF NOT EXISTS "events_stoppedAt_idx" ON "events"("stoppedAt");
CREATE INDEX IF NOT EXISTS "events_lockedAt_idx" ON "events"("lockedAt");
