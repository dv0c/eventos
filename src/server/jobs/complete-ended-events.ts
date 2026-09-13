import { EventStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { getLiveDeadlineAt } from "@/server/events/event-ended";
import { revokeGuestConnectIfEnded } from "@/server/events/revoke-guest-connect";

/**
 * Auto-stop (and permanently lock) events past the live window.
 */
export async function completeEndedEvents(now: Date = new Date()) {
  const running = await prisma.event.findMany({
    where: {
      deletedAt: null,
      liveStartedAt: { not: null },
      stoppedAt: null,
      lockedAt: null,
      status: {
        in: [EventStatus.DRAFT, EventStatus.PLANNING, EventStatus.ACTIVE],
      },
    },
    select: {
      id: true,
      liveStartedAt: true,
      pausedAt: true,
      stoppedAt: true,
      lockedAt: true,
      status: true,
    },
    take: 200,
  });

  let completed = 0;
  for (const event of running) {
    const deadline = getLiveDeadlineAt(event);
    if (!deadline || now.getTime() <= deadline.getTime()) continue;

    await prisma.event.update({
      where: { id: event.id },
      data: {
        pausedAt: null,
        stoppedAt: now,
        lockedAt: now,
        status: EventStatus.COMPLETED,
      },
    });
    await revokeGuestConnectIfEnded(event.id);
    completed += 1;
  }

  // Legacy: events stopped before permanent-lock shipped may lack lockedAt.
  const unlockedStopped = await prisma.event.updateMany({
    where: {
      deletedAt: null,
      stoppedAt: { not: null },
      lockedAt: null,
    },
    data: { lockedAt: now },
  });

  return {
    scanned: running.length,
    completed,
    locked: unlockedStopped.count,
  };
}
