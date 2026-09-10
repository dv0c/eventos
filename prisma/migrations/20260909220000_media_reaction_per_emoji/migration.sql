-- Allow multiple emoji reactions per guest per media (one row per emoji).
DROP INDEX IF EXISTS "media_reactions_mediaId_reactorKey_key";

CREATE UNIQUE INDEX "media_reactions_mediaId_reactorKey_emoji_key"
  ON "media_reactions"("mediaId", "reactorKey", "emoji");

CREATE INDEX "media_reactions_mediaId_reactorKey_idx"
  ON "media_reactions"("mediaId", "reactorKey");
