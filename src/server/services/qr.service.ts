import { AuditAction, QRCodeType } from "@prisma/client";
import QRCode from "qrcode";

import { prisma } from "@/server/db";
import { enforceEventAccess } from "@/server/permissions/enforce";
import { getStorageProvider } from "@/server/providers/storage";

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
  downloadUrl: string | null;
}

export const qrService = {
  async listQrCodes(userId: string, eventId: string): Promise<QrCodeWithUrl[]> {
    await enforceEventAccess(userId, eventId, "event:read");

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: { slug: true },
    });

    if (!event) {
      throw new QrServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const codes = await prisma.qRCode.findMany({
      where: { eventId },
      orderBy: { type: "asc" },
    });

    const storage = getStorageProvider();

    return Promise.all(
      codes.map(async (code) => ({
        id: code.id,
        type: code.type,
        url: code.url,
        storageKey: code.storageKey,
        downloadUrl: code.storageKey
          ? storage.getPublicUrl(code.storageKey)
          : null,
      })),
    );
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
      select: { slug: true },
    });

    if (!event) {
      throw new QrServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const types = type
      ? [type]
      : ([
          QRCodeType.EVENT,
          QRCodeType.RSVP,
          QRCodeType.UPLOAD,
          QRCodeType.WALL,
        ] as QRCodeType[]);

    const storage = getStorageProvider();
    const results: QrCodeWithUrl[] = [];

    for (const qrType of types) {
      const existing = await prisma.qRCode.findFirst({
        where: { eventId, type: qrType },
      });

      if (!existing) continue;

      const storageKey = `qr/${event.slug}/${qrType.toLowerCase()}.png`;
      const pngBuffer = await QRCode.toBuffer(existing.url, {
        type: "png",
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
      });

      const storedKey = await storage.upload(storageKey, pngBuffer, {
        contentType: "image/png",
      });

      const updated = await prisma.qRCode.update({
        where: { id: existing.id },
        data: { storageKey: storedKey },
      });

      results.push({
        id: updated.id,
        type: updated.type,
        url: updated.url,
        storageKey: updated.storageKey,
        downloadUrl: storage.getPublicUrl(storedKey),
      });
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

    if (!code.storageKey) {
      const generated = await this.generateQrCode(userId, eventId, type);
      const match = generated.find((g) => g.type === type);
      if (!match?.downloadUrl) {
        throw new QrServiceError("Failed to generate QR code", 500, "QR_GENERATION_FAILED");
      }
      return { downloadUrl: match.downloadUrl, type };
    }

    const storage = getStorageProvider();
    return {
      downloadUrl: storage.getPublicUrl(code.storageKey),
      type,
    };
  },
};
