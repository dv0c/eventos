import { EventStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { canStartEvent, getEventStartAt } from "@/server/events/event-ended";

/**
 * Auto-start events whose scheduled date+time has arrived.
 */
export async function autoStartScheduledEvents(now: Date = new Date()) {
  const candidates = await prisma.event.findMany({
    where: {
      deletedAt: null,
      date: { not: null },
      liveStartedAt: null,
      stoppedAt: null,
      lockedAt: null,
      status: {
        in: [EventStatus.DRAFT, EventStatus.PLANNING, EventStatus.ACTIVE],
      },
    },
    select: {
      id: true,
      organizationId: true,
      status: true,
      date: true,
      startTime: true,
      liveStartedAt: true,
      pausedAt: true,
      stoppedAt: true,
      lockedAt: true,
    },
    take: 200,
  });

  let started = 0;
  for (const event of candidates) {
    const startAt = getEventStartAt(event);
    if (!startAt || now.getTime() < startAt.getTime()) continue;
    if (!canStartEvent(event, now)) continue;

    await prisma.event.update({
      where: { id: event.id },
      data: {
        liveStartedAt: now,
        pausedAt: null,
        stoppedAt: null,
        lockedAt: null,
        status: EventStatus.ACTIVE,
      },
    });
    started += 1;
  }

  return { scanned: candidates.length, started };
}
