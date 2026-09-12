import { AuditAction, MediaStatus } from "@prisma/client";
import { nanoid } from "nanoid";

import { prisma } from "@/server/db";
import { isEventEnded, isEventWaiting } from "@/server/events/event-ended";
import { revokeGuestConnectIfEnded } from "@/server/events/revoke-guest-connect";
import { enforceEventAccess } from "@/server/permissions/enforce";
import { getStorageProvider } from "@/server/providers/storage";
import { auditService } from "@/server/services/audit.service";

const ALLOWED_AUDIO_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/3gpp",
  "audio/3gpp2",
  "audio/amr",
  "audio/x-caf",
  "audio/caf",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/3gpp",
  "video/3gpp2",
];

const MAX_DURATION_MS = 30_000;
const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_WISHES_PER_NAME_PER_DAY = 5;

export class VoiceWishServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message);
    this.name = "VoiceWishServiceError";
  }
}

function mimeFromExtension(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "webm":
      return "audio/webm";
    case "mp3":
      return "audio/mpeg";
    case "ogg":
    case "oga":
      return "audio/ogg";
    case "wav":
      return "audio/wav";
    case "m4a":
      return "audio/mp4";
    case "aac":
      return "audio/aac";
    case "caf":
      return "audio/x-caf";
    case "amr":
      return "audio/amr";
    case "3gp":
    case "3gpp":
      return "audio/3gpp";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    default:
      return null;
  }
}

function normalizeMimeType(file: File): string {
  const raw = (file.type || "").trim().toLowerCase();
  if (raw) return raw.split(";")[0]!.trim();
  return mimeFromExtension(file.name) ?? "";
}

function isAllowedWishMedia(mimeType: string): boolean {
  if (!mimeType) return false;
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return true;
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return true;
  return mimeType.startsWith("audio/") || mimeType.startsWith("video/");
}

function extForMime(mimeType: string, fileName?: string): string {
  if (mimeType.includes("quicktime") || mimeType.includes("mov")) return "mov";
  if (mimeType.startsWith("video/") && mimeType.includes("webm")) return "webm";
  if (mimeType.startsWith("video/")) return "mp4";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mpeg") || mimeType === "audio/mp3") return "mp3";
  if (mimeType.includes("3gpp")) return "3gp";
  if (mimeType.includes("amr")) return "amr";
  if (mimeType.includes("caf")) return "caf";
  if (mimeType.includes("mp4") || mimeType.includes("m4a") || mimeType.includes("aac"))
    return "m4a";
  const fromName = fileName?.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 4) return fromName;
  return "m4a";
}

async function getEventByAlbumToken(albumToken: string) {
  const settings = await prisma.eventSettings.findFirst({
    where: {
      isPublic: true,
      sections: {
        path: ["mediaUploadToken"],
        equals: albumToken,
      },
    },
    include: {
      event: true,
    },
  });

  if (!settings?.event || settings.event.deletedAt) {
    return null;
  }

  return { ...settings.event, settings };
}

export const voiceWishService = {
  async submitPublic(
    albumToken: string,
    file: File,
    uploadedBy: string,
    durationMs: number,
  ) {
    const event = await getEventByAlbumToken(albumToken);

    if (!event?.settings) {
      throw new VoiceWishServiceError("Album not found", 404, "ALBUM_NOT_FOUND");
    }

    if (isEventWaiting(event)) {
      throw new VoiceWishServiceError(
        "Event has not started yet",
        403,
        "EVENT_NOT_STARTED",
      );
    }

    if (isEventEnded(event)) {
      await revokeGuestConnectIfEnded(event.id);
      throw new VoiceWishServiceError("Event has ended", 403, "EVENT_ENDED");
    }

    if (!event.settings.enableGallery) {
      throw new VoiceWishServiceError(
        "Gallery is disabled",
        403,
        "GALLERY_DISABLED",
      );
    }

    if (!event.settings.enableVoiceWishes) {
      throw new VoiceWishServiceError(
        "Voice wishes are disabled",
        403,
        "WISHES_DISABLED",
      );
    }

    const name = uploadedBy.trim();
    if (!name) {
      throw new VoiceWishServiceError(
        "Guest name is required",
        400,
        "NAME_REQUIRED",
      );
    }

    const mimeType = normalizeMimeType(file);
    const isVideo = mimeType.startsWith("video/");

    if (!isAllowedWishMedia(mimeType)) {
      throw new VoiceWishServiceError(
        "Invalid media type",
        400,
        "INVALID_FILE_TYPE",
      );
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_AUDIO_SIZE;
    if (file.size > maxSize) {
      throw new VoiceWishServiceError(
        isVideo ? "File too large (max 50MB)" : "File too large (max 5MB)",
        400,
        "FILE_TOO_LARGE",
      );
    }

    const duration = Math.round(durationMs);
    if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_DURATION_MS) {
      throw new VoiceWishServiceError(
        "Wish must be between 1 and 30 seconds",
        400,
        "INVALID_DURATION",
      );
    }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const recentCount = await prisma.voiceWish.count({
      where: {
        eventId: event.id,
        uploadedBy: name,
        createdAt: { gte: dayStart },
      },
    });

    if (recentCount >= MAX_WISHES_PER_NAME_PER_DAY) {
      throw new VoiceWishServiceError(
        "Daily wish limit reached for this name",
        429,
        "RATE_LIMITED",
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wishId = nanoid(12);
    const ext = extForMime(mimeType, file.name);
    const storageKey = `wishes/${event.slug}/${wishId}.${ext}`;

    const storage = getStorageProvider();
    const storedKey = await storage.upload(storageKey, buffer, {
      contentType: mimeType || (isVideo ? "video/mp4" : "audio/mp4"),
    });

    const wish = await prisma.voiceWish.create({
      data: {
        eventId: event.id,
        storageKey: storedKey,
        mimeType: mimeType || (isVideo ? "video/mp4" : "audio/mp4"),
        fileName: file.name || `wish.${ext}`,
        fileSize: file.size,
        durationMs: duration,
        uploadedBy: name,
      },
    });

    return {
      id: wish.id,
      durationMs: wish.durationMs,
      createdAt: wish.createdAt.toISOString(),
    };
  },

  async getHostSummary(userId: string, eventId: string) {
    await enforceEventAccess(userId, eventId, "media:read");

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        status: true,
        date: true,
        endDate: true,
        startTime: true,
        endTime: true,
        settings: { select: { enableVoiceWishes: true } },
      },
    });

    if (!event) {
      throw new VoiceWishServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const count = await prisma.voiceWish.count({ where: { eventId } });
    const unlocked = isEventEnded(event);

    return {
      count,
      unlocked,
      enableVoiceWishes: event.settings?.enableVoiceWishes ?? true,
    };
  },

  async listForHost(userId: string, eventId: string) {
    await enforceEventAccess(userId, eventId, "media:read");

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        status: true,
        date: true,
        endDate: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!event) {
      throw new VoiceWishServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const unlocked = isEventEnded(event);
    const count = await prisma.voiceWish.count({ where: { eventId } });

    if (!unlocked) {
      return {
        count,
        unlocked: false as const,
        items: [] as Array<{
          id: string;
          url: string;
          mimeType: string;
          fileName: string;
          durationMs: number;
          uploadedBy: string | null;
          createdAt: string;
        }>,
      };
    }

    const wishes = await prisma.voiceWish.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });

    const storage = getStorageProvider();

    return {
      count,
      unlocked: true as const,
      items: wishes.map((wish) => ({
        id: wish.id,
        url: storage.getPublicUrl(wish.storageKey),
        mimeType: wish.mimeType,
        fileName: wish.fileName,
        durationMs: wish.durationMs,
        uploadedBy: wish.uploadedBy,
        createdAt: wish.createdAt.toISOString(),
      })),
    };
  },

  async deleteWish(
    userId: string,
    eventId: string,
    wishId: string,
    ipAddress?: string,
  ) {
    const access = await enforceEventAccess(userId, eventId, "media:manage");

    const wish = await prisma.voiceWish.findFirst({
      where: { id: wishId, eventId },
    });

    if (!wish) {
      throw new VoiceWishServiceError("Wish not found", 404, "WISH_NOT_FOUND");
    }

    const storage = getStorageProvider();
    try {
      await storage.delete(wish.storageKey);
    } catch {
      // Continue with DB delete even if storage delete fails
    }

    await prisma.voiceWish.delete({ where: { id: wish.id } });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "VoiceWish",
      entityId: wish.id,
      metadata: { uploadedBy: wish.uploadedBy, deleted: true },
      ipAddress,
    });

    return { deleted: true };
  },

  async listForZip(eventId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: { status: true, date: true, endDate: true, startTime: true, endTime: true },
    });

    if (!event || !isEventEnded(event)) {
      return [];
    }

    return prisma.voiceWish.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    });
  },

  async listApprovedMediaForZip(eventId: string) {
    return prisma.media.findMany({
      where: {
        eventId,
        status: { in: [MediaStatus.APPROVED, MediaStatus.FEATURED] },
      },
      orderBy: { createdAt: "asc" },
    });
  },
};
