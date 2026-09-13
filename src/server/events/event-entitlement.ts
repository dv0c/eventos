import { prisma } from "@/server/db";
import {
  collectPremiumSettingsTouches,
  isEventPremium,
  type PremiumSettingsKey,
} from "@/lib/event-premium";

export {
  collectPremiumSettingsTouches,
  isEventPremium,
  type PremiumSettingsKey,
  PREMIUM_SETTINGS_KEYS,
} from "@/lib/event-premium";

/** Free events each user may create before Premium purchase is required. */
export const FREE_EVENT_QUOTA = 3;

export class PremiumRequiredError extends Error {
  readonly statusCode = 403;
  readonly code = "PREMIUM_REQUIRED";

  constructor(message = "This setting requires a Premium event") {
    super(message);
    this.name = "PremiumRequiredError";
  }
}

export class FreeQuotaExceededError extends Error {
  readonly statusCode = 403;
  readonly code = "FREE_QUOTA_EXCEEDED";

  constructor(
    message = `Free event limit reached (${FREE_EVENT_QUOTA}). Purchase a Premium event to continue.`,
  ) {
    super(message);
    this.name = "FreeQuotaExceededError";
  }
}

export function assertPremiumSettingsAllowed(
  event: { tier?: string | null },
  touches: PremiumSettingsKey[],
): void {
  if (touches.length === 0) return;
  if (isEventPremium(event)) return;
  throw new PremiumRequiredError();
}

export async function countOwnedEvents(userId: string): Promise<number> {
  const owned = await prisma.organizationMember.findMany({
    where: {
      userId,
      role: "OWNER",
      organization: { deletedAt: null },
    },
    select: { organizationId: true },
  });
  const ids = owned.map((row) => row.organizationId);
  if (ids.length === 0) return 0;
  return prisma.event.count({
    where: { organizationId: { in: ids }, deletedAt: null },
  });
}

export async function getFreeEventQuotaState(userId: string): Promise<{
  used: number;
  limit: number;
  remaining: number;
  canCreateFree: boolean;
}> {
  const used = await countOwnedEvents(userId);
  const remaining = Math.max(0, FREE_EVENT_QUOTA - used);
  return {
    used,
    limit: FREE_EVENT_QUOTA,
    remaining,
    canCreateFree: remaining > 0,
  };
}
