import { NotificationType } from "@prisma/client";

import { prisma } from "@/server/db";
import {
  getLiveDeadlineAt,
  getMediaPurgeAt,
} from "@/server/events/event-ended";
import {
  enqueueNotification,
  eventMediaLink,
  eventOverviewLink,
  notificationService,
} from "@/server/notifications/emit";

const DAY_MS = 24 * 60 * 60 * 1000;
const ENDING_SOON_WINDOW_MS = DAY_MS;
const PURGE_SOON_WINDOW_MS = 3 * DAY_MS;

/**
 * Notify stakeholders when live window ends within ~24h, and when media purge
 * is within ~3 days. Dedupes via existing unread/recent notifications.
 */
export async function notifyLifecycleAlerts(now: Date = new Date()) {
  let endingSoon = 0;
  let purgeSoon = 0;

  const liveEvents = await prisma.event.findMany({
    where: {
      deletedAt: null,
      liveStartedAt: { not: null },
      stoppedAt: null,
      lockedAt: null,
    },
    select: {
      id: true,
      name: true,
      liveStartedAt: true,
      pausedAt: true,
      stoppedAt: true,
      lockedAt: true,
      status: true,
      organization: { select: { slug: true } },
    },
    take: 200,
  });

  for (const event of liveEvents) {
    const deadline = getLiveDeadlineAt(event);
    if (!deadline) continue;
    const msLeft = deadline.getTime() - now.getTime();
    if (msLeft <= 0 || msLeft > ENDING_SOON_WINDOW_MS) continue;

    const recent = await prisma.notification.findFirst({
      where: {
        eventId: event.id,
        type: NotificationType.EVENT_ENDING_SOON,
        createdAt: { gte: new Date(now.getTime() - DAY_MS) },
      },
      select: { id: true },
    });
    if (recent) continue;

    endingSoon += await notificationService.notifyEventStakeholders(event.id, {
      type: NotificationType.EVENT_ENDING_SOON,
      title: "Event ending soon",
      body: `${event.name} live window ends within 24 hours`,
      link: eventOverviewLink(event.organization.slug, event.id),
    });
  }

  const endedCandidates = await prisma.event.findMany({
    where: {
      deletedAt: null,
      OR: [
        { stoppedAt: { not: null } },
        { lockedAt: { not: null } },
      ],
      media: { some: {} },
    },
    select: {
      id: true,
      name: true,
      date: true,
      endDate: true,
      endTime: true,
      startTime: true,
      liveStartedAt: true,
      pausedAt: true,
      stoppedAt: true,
      lockedAt: true,
      status: true,
      organization: { select: { slug: true } },
    },
    take: 200,
  });

  for (const event of endedCandidates) {
    const purgeAt = getMediaPurgeAt(event);
    if (!purgeAt) continue;
    const msLeft = purgeAt.getTime() - now.getTime();
    if (msLeft <= 0 || msLeft > PURGE_SOON_WINDOW_MS) continue;

    const recent = await prisma.notification.findFirst({
      where: {
        eventId: event.id,
        type: NotificationType.MEDIA_PURGE_SOON,
        createdAt: { gte: new Date(now.getTime() - DAY_MS) },
      },
      select: { id: true },
    });
    if (recent) continue;

    purgeSoon += await notificationService.notifyEventStakeholders(event.id, {
      type: NotificationType.MEDIA_PURGE_SOON,
      title: "Media purge soon",
      body: `${event.name}: album media will be deleted soon`,
      link: eventMediaLink(event.organization.slug, event.id),
    });
  }

  return { endingSoon, purgeSoon };
}

export function enqueueLifecycleAlerts(now?: Date) {
  enqueueNotification(() => notifyLifecycleAlerts(now));
}
