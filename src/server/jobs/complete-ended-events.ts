import { EventStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { isEventEnded } from "@/server/events/event-ended";
import { revokeGuestConnectIfEnded } from "@/server/events/revoke-guest-connect";

/**
 * Mark schedule-ended events as COMPLETED and revoke live guest QR types.
 */
export async function completeEndedEvents(now: Date = new Date()) {
  const candidates = await prisma.event.findMany({
    where: {
      deletedAt: null,
      status: {
        in: [EventStatus.DRAFT, EventStatus.PLANNING, EventStatus.ACTIVE],
      },
      OR: [{ endDate: { lte: now } }, { endDate: null, date: { lte: now } }],
    },
    select: {
      id: true,
      status: true,
      date: true,
      endDate: true,
      startTime: true,
      endTime: true,
    },
    take: 200,
  });

  let completed = 0;
  for (const event of candidates) {
    if (!isEventEnded(event)) continue;
    const did = await revokeGuestConnectIfEnded(event.id);
    if (did) completed += 1;
  }

  return { scanned: candidates.length, completed };
}
