import { EventStatus, QRCodeType } from "@prisma/client";

import { prisma } from "@/server/db";
import { isEventEnded } from "@/server/events/event-ended";

export const GUEST_QR_TYPES: QRCodeType[] = [
  QRCodeType.EVENT,
  QRCodeType.RSVP,
  QRCodeType.UPLOAD,
  QRCodeType.WALL,
];

/** Live/share QR types that are revoked after the event ends (UPLOAD stays). */
export const REVOKED_GUEST_QR_TYPES: QRCodeType[] = [
  QRCodeType.EVENT,
  QRCodeType.RSVP,
  QRCodeType.WALL,
];

/**
 * When an event has ended: delete non-upload guest QR rows and mark status
 * COMPLETED if it was still DRAFT/PLANNING/ACTIVE.
 * Keeps mediaUploadToken and UPLOAD QR for album viewing; uploads are gated
 * separately via isGuestPhotoUploadAllowed (active only).
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
      endDate: true,
      startTime: true,
      endTime: true,
    },
  });

  if (!event || !isEventEnded(event)) {
    return false;
  }

  await prisma.$transaction(async (tx) => {
    await tx.qRCode.deleteMany({
      where: {
        eventId,
        type: { in: REVOKED_GUEST_QR_TYPES },
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
