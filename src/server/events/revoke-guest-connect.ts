import { EventStatus, QRCodeType, type Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { isEventEnded } from "@/server/events/event-ended";
import type { EventSections } from "@/server/events/wall-settings";

export const GUEST_QR_TYPES: QRCodeType[] = [
  QRCodeType.EVENT,
  QRCodeType.RSVP,
  QRCodeType.UPLOAD,
  QRCodeType.WALL,
];

/**
 * When an event has ended: clear the album token, delete guest QR rows,
 * and mark status COMPLETED if it was still DRAFT/PLANNING/ACTIVE.
 * Returns true if revoke ran (event is ended).
 */
export async function revokeGuestConnectIfEnded(
  eventId: string,
): Promise<boolean> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    select: {
      id: true,
      status: true,
      date: true,
      endTime: true,
      settings: { select: { sections: true } },
    },
  });

  if (!event || !isEventEnded(event)) {
    return false;
  }

  const sections = (event.settings?.sections ?? {}) as EventSections;
  const nextSections = { ...sections };
  delete nextSections.mediaUploadToken;

  await prisma.$transaction(async (tx) => {
    if (event.settings) {
      await tx.eventSettings.update({
        where: { eventId },
        data: { sections: nextSections as Prisma.InputJsonValue },
      });
    }

    await tx.qRCode.deleteMany({
      where: {
        eventId,
        type: { in: GUEST_QR_TYPES },
      },
    });

    if (
      event.status === EventStatus.DRAFT ||
      event.status === EventStatus.PLANNING ||
      event.status === EventStatus.ACTIVE
    ) {
      await tx.event.update({
        where: { id: eventId },
        data: { status: EventStatus.COMPLETED },
      });
    }
  });

  return true;
}
