-- AlterTable: add collage/photo mode for album games
ALTER TABLE "event_games" ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'photo';

-- Backfill legacy collage presets
UPDATE "event_games" SET "mode" = 'collage' WHERE "presetKey" = 'collage';
