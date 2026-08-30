import { AuditAction, MediaStatus } from "@prisma/client";
import { nanoid } from "nanoid";

import { prisma } from "@/server/db";
import { mediaProcessingQueue } from "@/server/jobs/queues";
import { enforceEventAccess } from "@/server/permissions/enforce";
import { getStorageProvider } from "@/server/providers/storage";
import { eventRepository } from "@/server/repositories/event.repository";

import { auditService } from "./audit.service";

export class MediaServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "MediaServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface EventSections {
  mediaUploadToken?: string;
  [key: string]: unknown;
}

async function getEventByUploadToken(uploadToken: string) {
  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    include: { settings: true },
  });

  return events.find((event) => {
    const sections = (event.settings?.sections ?? {}) as EventSections;
    return sections.mediaUploadToken === uploadToken;
  });
}

async function ensureUploadToken(eventId: string): Promise<string> {
  const settings = await prisma.eventSettings.findUnique({
    where: { eventId },
  });

  if (!settings) {
    throw new MediaServiceError("Event settings not found", 404, "SETTINGS_NOT_FOUND");
  }

  const sections = (settings.sections ?? {}) as EventSections;

  if (sections.mediaUploadToken) {
    return sections.mediaUploadToken;
  }

  const mediaUploadToken = nanoid(24);
  await prisma.eventSettings.update({
    where: { eventId },
    data: {
      sections: {
        ...sections,
        mediaUploadToken,
      },
    },
  });

  return mediaUploadToken;
}

export const mediaService = {
  async getUploadTokenForEvent(eventId: string): Promise<string> {
    return ensureUploadToken(eventId);
  },

  async getUploadTokenBySlug(eventSlug: string): Promise<{
    uploadToken: string;
    eventName: string;
    enableGallery: boolean;
  } | null> {
    const event = await eventRepository.findBySlugPublic(eventSlug);

    if (!event?.settings?.enableGallery) {
      return null;
    }

    const uploadToken = await ensureUploadToken(event.id);

    return {
      uploadToken,
      eventName: event.name,
      enableGallery: event.settings.enableGallery,
    };
  },

  async uploadPublic(
    uploadToken: string,
    file: File,
    caption?: string,
    uploadedBy?: string,
  ) {
    const event = await getEventByUploadToken(uploadToken);

    if (!event) {
      throw new MediaServiceError("Invalid upload token", 404, "INVALID_TOKEN");
    }

    if (!event.settings?.enableGallery) {
      throw new MediaServiceError("Gallery uploads are disabled", 403, "GALLERY_DISABLED");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new MediaServiceError("Invalid file type", 400, "INVALID_FILE_TYPE");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new MediaServiceError("File too large (max 10MB)", 400, "FILE_TOO_LARGE");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() ?? "jpg";
    const mediaId = nanoid(12);
    const storageKey = `media/${event.slug}/${mediaId}.${ext}`;

    const storage = getStorageProvider();
    await storage.upload(storageKey, buffer, { contentType: file.type });

    const media = await prisma.media.create({
      data: {
        eventId: event.id,
        uploadToken: nanoid(21),
        storageKey,
        mimeType: file.type,
        fileName: file.name,
        fileSize: file.size,
        caption: caption ?? null,
        status: MediaStatus.PENDING,
        uploadedBy: uploadedBy ?? null,
      },
    });

    try {
      await mediaProcessingQueue.add("process-media", { mediaId: media.id });
    } catch {
      // Queue unavailable — media stays pending for manual moderation
    }

    return {
      id: media.id,
      status: media.status,
      fileName: media.fileName,
    };
  },

  async listMedia(
    userId: string,
    eventId: string,
    status?: MediaStatus,
  ) {
    await enforceEventAccess(userId, eventId, "media:read");

    const storage = getStorageProvider();

    const items = await prisma.media.findMany({
      where: {
        eventId,
        ...(status ? { status } : {}),
      },
      include: {
        moderation: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return items.map((item) => ({
      ...item,
      url: storage.getPublicUrl(item.storageKey),
    }));
  },

  async moderateMedia(
    userId: string,
    eventId: string,
    mediaId: string,
    action: "approve" | "reject" | "feature",
    reason?: string,
    ipAddress?: string,
  ) {
    const access = await enforceEventAccess(userId, eventId, "media:manage");

    const media = await prisma.media.findFirst({
      where: { id: mediaId, eventId },
    });

    if (!media) {
      throw new MediaServiceError("Media not found", 404, "MEDIA_NOT_FOUND");
    }

    const statusMap: Record<string, MediaStatus> = {
      approve: MediaStatus.APPROVED,
      reject: MediaStatus.REJECTED,
      feature: MediaStatus.FEATURED,
    };

    const newStatus = statusMap[action];
    const isFeatured = action === "feature";

    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: {
        status: newStatus,
        isFeatured,
      },
    });

    await prisma.mediaModeration.create({
      data: {
        mediaId,
        action,
        reason: reason ?? null,
        moderatedBy: userId,
      },
    });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "Media",
      entityId: mediaId,
      metadata: { action, reason },
      ipAddress,
    });

    const storage = getStorageProvider();

    return {
      ...updated,
      url: storage.getPublicUrl(updated.storageKey),
    };
  },

  async getWallMedia(eventSlug: string, since?: Date) {
    const event = await eventRepository.findBySlugPublic(eventSlug);

    if (!event?.settings?.enableWall) {
      return [];
    }

    const storage = getStorageProvider();

    const items = await prisma.media.findMany({
      where: {
        eventId: event.id,
        status: { in: [MediaStatus.APPROVED, MediaStatus.FEATURED] },
        ...(since ? { updatedAt: { gt: since } } : {}),
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    return items.map((item) => ({
      id: item.id,
      url: storage.getPublicUrl(item.storageKey),
      caption: item.caption,
      isFeatured: item.isFeatured,
      createdAt: item.createdAt.toISOString(),
    }));
  },

  async getAllWallMedia(eventSlug: string) {
    const event = await eventRepository.findBySlugPublic(eventSlug);

    if (!event?.settings?.enableWall) {
      return [];
    }

    const storage = getStorageProvider();

    const items = await prisma.media.findMany({
      where: {
        eventId: event.id,
        status: { in: [MediaStatus.APPROVED, MediaStatus.FEATURED] },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

    return items.map((item) => ({
      id: item.id,
      url: storage.getPublicUrl(item.storageKey),
      caption: item.caption,
      isFeatured: item.isFeatured,
      createdAt: item.createdAt.toISOString(),
    }));
  },
};
