-- Raise free plan event create cap from 1 to 3.
UPDATE "plans"
SET "limits" = jsonb_set(COALESCE("limits", '{}'::jsonb), '{maxEvents}', '3'::jsonb, true)
WHERE "slug" = 'free';
