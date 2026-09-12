import { AuditAction, QRCodeType } from "@prisma/client";
import QRCode from "qrcode";

import { prisma } from "@/server/db";
import {
  getEventLifecycle,
  type EventLifecycle,
} from "@/server/events/event-ended";
import {
  GUEST_QR_TYPES,
  REVOKED_GUEST_QR_TYPES,
  revokeGuestConnectIfEnded,
} from "@/server/events/revoke-guest-connect";
import { enforceEventAccess } from "@/server/permissions/enforce";
import { getStorageProvider } from "@/server/providers/storage";
import { mediaService } from "@/server/services/media.service";

import { auditService } from "./audit.service";

export class QrServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "QrServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface QrCodeWithUrl {
  id: string;
  type: QRCodeType;
  url: string;
  storageKey: string | null;
  imageUrl: string;
  downloadUrl: string | null;
}

const ALL_QR_TYPES: QRCodeType[] = [
  QRCodeType.EVENT,
  QRCodeType.RSVP,
  QRCodeType.UPLOAD,
  QRCodeType.WALL,
  QRCodeType.MODERATION,
  QRCodeType.DJ,
];

function buildImageUrl(eventId: string, type: QRCodeType): string {
  return `/api/events/${eventId}/qr/image?type=${type}`;
}

function buildDownloadUrl(eventId: string, type: QRCodeType): string {
  // Always serve via on-the-fly API so previews/downloads work even when
  // storageKey points at a missing object (e.g. legacy seed data).
  return `${buildImageUrl(eventId, type)}&download=1`;
}

function mapQrCode(
  eventId: string,
  code: {
    id: string;
    type: QRCodeType;
    url: string;
    storageKey: string | null;
  },
): QrCodeWithUrl {
  return {
    id: code.id,
    type: code.type,
    url: code.url,
    storageKey: code.storageKey,
    imageUrl: buildImageUrl(eventId, code.type),
    downloadUrl: buildDownloadUrl(eventId, code.type),
  };
}

function isGuestQrType(type: QRCodeType): boolean {
  return GUEST_QR_TYPES.includes(type);
}

function isPostEndGuestQrAllowed(type: QRCodeType): boolean {
  return type === QRCodeType.UPLOAD;
}

function assertGuestQrAllowedForLifecycle(
  lifecycle: EventLifecycle,
  type: QRCodeType,
): void {
  if (!isGuestQrType(type)) {
    return;
  }

  if (lifecycle === "ended" && !isPostEndGuestQrAllowed(type)) {
    throw new QrServiceError("Event has ended", 410, "EVENT_ENDED");
  }
}

function qrTypesForLifecycle(
  lifecycle: EventLifecycle,
  type?: QRCodeType,
): QRCodeType[] {
  if (type) {
    assertGuestQrAllowedForLifecycle(lifecycle, type);
    return [type];
  }

  if (lifecycle === "ended") {
    return ALL_QR_TYPES.filter(
      (t) => !isGuestQrType(t) || isPostEndGuestQrAllowed(t),
    );
  }

  return ALL_QR_TYPES;
}

function listFilterForLifecycle(lifecycle: EventLifecycle): {
  type?: { notIn: QRCodeType[] } | { in: QRCodeType[] };
} {
  if (lifecycle === "ended") {
    return { type: { notIn: REVOKED_GUEST_QR_TYPES } };
  }
  return {};
}

async function resolveQrUrl(
  eventId: string,
  eventSlug: string,
  orgSlug: string,
  type: QRCodeType,
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicBase = `${baseUrl}/el/e/${eventSlug}`;

  switch (type) {
    case QRCodeType.EVENT:
      return publicBase;
    case QRCodeType.RSVP:
      return `${publicBase}?rsvp=1`;
    case QRCodeType.UPLOAD: {
      const albumToken = await mediaService.getUploadTokenForEvent(eventId);
      return `${baseUrl}/el/a/${albumToken}`;
    }
    case QRCodeType.WALL:
      return `${publicBase}/wall`;
    case QRCodeType.MODERATION:
      return `${baseUrl}/el/mod/${eventId}`;
    case QRCodeType.DJ:
      return `${baseUrl}/el/mod/${eventId}/dj`;
    default:
      return publicBase;
  }
}

export const qrService = {
  async renderQrImage(
    userId: string,
    eventId: string,
    type: QRCodeType,
  ): Promise<Buffer> {
    await enforceEventAccess(userId, eventId, "event:read");

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        slug: true,
        status: true,
        date: true,
        endDate: true,
        startTime: true,
        endTime: true,
        organization: { select: { slug: true } },
      },
    });

    if (!event) {
      throw new QrServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const lifecycle = getEventLifecycle(event);
    if (lifecycle === "ended") {
      await revokeGuestConnectIfEnded(eventId);
    }
    assertGuestQrAllowedForLifecycle(lifecycle, type);

    const code = await prisma.qRCode.findFirst({
      where: { eventId, type },
    });

    if (!code) {
      throw new QrServiceError("QR code not found", 404, "QR_NOT_FOUND");
    }

    // Always encode the current APP_URL so LAN/prod env changes work without regenerating.
    const url = await resolveQrUrl(
      eventId,
      event.slug,
      event.organization.slug,
      type,
    );

    if (url !== code.url) {
      await prisma.qRCode.update({
        where: { id: code.id },
        data: { url },
      });
    }

    return QRCode.toBuffer(url, {
      type: "png",
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    });
  },

  async listQrCodes(userId: string, eventId: string): Promise<QrCodeWithUrl[]> {
    await enforceEventAccess(userId, eventId, "event:read");

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        slug: true,
        status: true,
        date: true,
        endDate: true,
        startTime: true,
        endTime: true,
        organization: { select: { slug: true } },
      },
    });

    if (!event) {
      throw new QrServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const lifecycle = getEventLifecycle(event);
    if (lifecycle === "ended") {
      await revokeGuestConnectIfEnded(eventId);
    }

    const codes = await prisma.qRCode.findMany({
      where: {
        eventId,
        ...listFilterForLifecycle(lifecycle),
      },
      orderBy: { type: "asc" },
    });

    const orgSlug = event.organization.slug;
    const results: QrCodeWithUrl[] = [];

    for (const code of codes) {
      const url = await resolveQrUrl(eventId, event.slug, orgSlug, code.type);
      if (url !== code.url) {
        await prisma.qRCode.update({
          where: { id: code.id },
          data: { url },
        });
      }
      results.push(mapQrCode(eventId, { ...code, url }));
    }

    return results;
  },

  async generateQrCode(
    userId: string,
    eventId: string,
    type?: QRCodeType,
    ipAddress?: string,
  ): Promise<QrCodeWithUrl[]> {
    const access = await enforceEventAccess(userId, eventId, "event:update");

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        slug: true,
        status: true,
        date: true,
        endDate: true,
        startTime: true,
        endTime: true,
        organization: { select: { slug: true } },
      },
    });

    if (!event) {
      throw new QrServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const lifecycle = getEventLifecycle(event);
    if (lifecycle === "ended") {
      await revokeGuestConnectIfEnded(eventId);
    }

    const orgSlug = event.organization.slug;
    const types = qrTypesForLifecycle(lifecycle, type);
    const storage = getStorageProvider();
    const results: QrCodeWithUrl[] = [];

    for (const qrType of types) {
      const url = await resolveQrUrl(eventId, event.slug, orgSlug, qrType);

      const existing = await prisma.qRCode.findFirst({
        where: { eventId, type: qrType },
      });

      const row = existing
        ? await prisma.qRCode.update({
            where: { id: existing.id },
            data: { url },
          })
        : await prisma.qRCode.create({
            data: { eventId, type: qrType, url },
          });

      const storageKey = `qr/${event.slug}/${qrType.toLowerCase()}.png`;
      const pngBuffer = await QRCode.toBuffer(row.url, {
        type: "png",
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
      });

      const storedKey = await storage.upload(storageKey, pngBuffer, {
        contentType: "image/png",
      });

      const updated = await prisma.qRCode.update({
        where: { id: row.id },
        data: { storageKey: storedKey },
      });

      results.push(mapQrCode(eventId, updated));
    }

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "QRCode",
      entityId: eventId,
      metadata: { types: types.map((t) => t.toLowerCase()) },
      ipAddress,
    });

    return results;
  },

  async getDownloadUrl(
    userId: string,
    eventId: string,
    type: QRCodeType,
  ): Promise<{ downloadUrl: string; type: QRCodeType }> {
    await enforceEventAccess(userId, eventId, "event:read");

    const code = await prisma.qRCode.findFirst({
      where: { eventId, type },
    });

    if (!code) {
      throw new QrServiceError("QR code not found", 404, "QR_NOT_FOUND");
    }

    return {
      downloadUrl: buildDownloadUrl(eventId, type),
      type,
    };
  },
};
