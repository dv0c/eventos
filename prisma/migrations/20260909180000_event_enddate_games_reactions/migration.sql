-- AlterTable
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);

-- Backfill endDate from date for existing rows
UPDATE "events" SET "endDate" = "date" WHERE "endDate" IS NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "event_games" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "presetKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_games_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "event_games_eventId_idx" ON "event_games"("eventId");
CREATE INDEX IF NOT EXISTS "event_games_eventId_sortOrder_idx" ON "event_games"("eventId", "sortOrder");

DO $$ BEGIN
  ALTER TABLE "event_games" ADD CONSTRAINT "event_games_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- MediaReaction: add reactorKey and unique constraint
ALTER TABLE "media_reactions" ADD COLUMN IF NOT EXISTS "reactorKey" TEXT;

UPDATE "media_reactions"
SET "reactorKey" = 'legacy-' || "id"
WHERE "reactorKey" IS NULL OR "reactorKey" = '';

ALTER TABLE "media_reactions" ALTER COLUMN "reactorKey" SET NOT NULL;

DROP INDEX IF EXISTS "media_reactions_mediaId_reactorKey_key";
CREATE UNIQUE INDEX "media_reactions_mediaId_reactorKey_key" ON "media_reactions"("mediaId", "reactorKey");
