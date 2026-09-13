import { prisma } from "@/server/db";
import {
  getEventEndAt,
  isEventEnded,
  MEDIA_RETENTION_DAYS,
} from "@/server/events/event-ended";
import { getStorageProvider } from "@/server/providers/storage";

function retentionDays(): number {
  const raw = process.env.MEDIA_RETENTION_DAYS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : MEDIA_RETENTION_DAYS;
}

/**
 * Delete storage + DB media rows for events whose retention window has passed.
 * Keeps the event row itself.
 */
export async function purgeExpiredEventMedia(now: Date = new Date()) {
  const days = retentionDays();

  const candidates = await prisma.event.findMany({
    where: {
      deletedAt: null,
      media: { some: {} },
      OR: [{ endDate: { lte: now } }, { endDate: null, date: { lte: now } }],
    },
    select: {
      id: true,
      status: true,
      date: true,
      endDate: true,
      endTime: true,
      media: {
        select: { id: true, storageKey: true, thumbnailKey: true },
      },
    },
    take: 100,
  });

  const storage = getStorageProvider();
  let purgedEvents = 0;
  let purgedMedia = 0;

  for (const event of candidates) {
    if (!isEventEnded(event)) continue;

    const endAt = getEventEndAt(event);
    const purgeAt = new Date(endAt.getTime() + days * 24 * 60 * 60 * 1000);
    if (now.getTime() <= purgeAt.getTime()) continue;

    for (const media of event.media) {
      try {
        await storage.delete(media.storageKey);
      } catch {
        // continue
      }
      if (media.thumbnailKey) {
        try {
          await storage.delete(media.thumbnailKey);
        } catch {
          // continue
        }
      }
    }

    const result = await prisma.media.deleteMany({
      where: { eventId: event.id },
    });
    purgedMedia += result.count;
    purgedEvents += 1;
  }

  return { purgedEvents, purgedMedia, retentionDays: days };
}
