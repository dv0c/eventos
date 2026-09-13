-- CreateEnum
CREATE TYPE "EventTier" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "EventPurchaseStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "EventPurchasePurpose" AS ENUM ('UPGRADE', 'CREATE');

-- AlterTable
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "tier" "EventTier" NOT NULL DEFAULT 'FREE';
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "premiumUnlockedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "events_tier_idx" ON "events"("tier");

-- CreateTable
CREATE TABLE IF NOT EXISTS "event_purchases" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "EventPurchasePurpose" NOT NULL,
    "status" "EventPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "event_purchases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_purchases_stripeSessionId_key" ON "event_purchases"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "event_purchases_organizationId_idx" ON "event_purchases"("organizationId");
CREATE INDEX IF NOT EXISTS "event_purchases_userId_idx" ON "event_purchases"("userId");
CREATE INDEX IF NOT EXISTS "event_purchases_eventId_idx" ON "event_purchases"("eventId");
CREATE INDEX IF NOT EXISTS "event_purchases_status_idx" ON "event_purchases"("status");

ALTER TABLE "event_purchases" DROP CONSTRAINT IF EXISTS "event_purchases_eventId_fkey";
ALTER TABLE "event_purchases" ADD CONSTRAINT "event_purchases_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "event_purchases" DROP CONSTRAINT IF EXISTS "event_purchases_organizationId_fkey";
ALTER TABLE "event_purchases" ADD CONSTRAINT "event_purchases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_purchases" DROP CONSTRAINT IF EXISTS "event_purchases_userId_fkey";
ALTER TABLE "event_purchases" ADD CONSTRAINT "event_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
