import { AuditAction, EventStatus, MediaStatus, type Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import sharp from "sharp";

import { WALL_REACTION_EMOJIS } from "@/lib/wall-reactions";
import { isAlbumChallengeId } from "@/lib/album-challenges";
import { FREE_PHOTO_CAP, isEventPremium } from "@/lib/event-premium";
import { prisma } from "@/server/db";
import {
  isEventEnded,
  isEventWaiting,
  isGuestLiveFeaturesAllowed,
  isGuestPhotoUploadAllowed,
} from "@/server/events/event-ended";
import { revokeGuestConnectIfEnded } from "@/server/events/revoke-guest-connect";
import {
  getAppearanceFromSections,
  getModerationFromSections,
  getWallAnnouncementFromSections,
  getWallSettingsFromSections,
  WALL_ANNOUNCEMENT_TTL_MS,
  clampAnnouncementDurationSec,
  type WallAnnouncementPayload,
} from "@/server/events/wall-settings";
import { mediaProcessingQueue } from "@/server/jobs/queues";
import { enforceEventAccess } from "@/server/permissions/enforce";
import { getStorageProvider } from "@/server/providers/storage";
import { eventRepository } from "@/server/repositories/event.repository";
import { maybeTranscodeVideoToMp4 } from "@/server/media/transcode-video";

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

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_DURATION_MS = 30_000;
const MAX_IMAGE_EDGE = 2048;
const IMAGE_QUALITY = 82;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

function stripMimeParams(mime: string): string {
  return mime.split(";")[0]?.trim().toLowerCase() || "";
}

function extensionForContentType(contentType: string, isVideo: boolean): string {
  const type = stripMimeParams(contentType);
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "image/jpeg" || type === "image/jpg") return "jpg";
  if (type === "video/webm") return "webm";
  if (type === "video/quicktime") return "mov";
  if (type === "video/mp4") return "mp4";
  return isVideo ? "mp4" : "jpg";
}

/**
 * EXIF-orient, resize (max 2048), and compress to a single wall-quality file.
 * GIFs are left untouched to preserve animation.
 */
async function normalizeImageBuffer(
  buffer: Buffer,
  contentType: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const type = stripMimeParams(contentType);
  if (!ALLOWED_IMAGE_TYPES.includes(type)) {
    return { buffer, contentType: type || contentType };
  }

  if (type === "image/gif") {
    return { buffer, contentType: "image/gif" };
  }

  try {
    const meta = await sharp(buffer).metadata();
    const pipeline = sharp(buffer)
      .rotate()
      .resize({
        width: MAX_IMAGE_EDGE,
        height: MAX_IMAGE_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      });

    if (meta.hasAlpha) {
      const out = await pipeline
        .webp({ quality: IMAGE_QUALITY })
        .toBuffer({ resolveWithObject: true });
      return { buffer: out.data, contentType: "image/webp" };
    }

    const out = await pipeline
      .jpeg({ quality: IMAGE_QUALITY, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return { buffer: out.data, contentType: "image/jpeg" };
  } catch {
    return { buffer, contentType: type || contentType };
  }
}

function aggregateReactionCounts(reactions: { emoji: string }[]): Record<string, number> {
  const reactionCounts: Record<string, number> = {};
  for (const emoji of WALL_REACTION_EMOJIS) {
    reactionCounts[emoji] = 0;
  }
  for (const reaction of reactions) {
    if (reaction.emoji in reactionCounts) {
      reactionCounts[reaction.emoji] += 1;
    }
  }
  return reactionCounts;
}

interface EventSections {
  mediaUploadToken?: string;
  [key: string]: unknown;
}

async function getEventByUploadToken(uploadToken: string) {
  const settings = await prisma.eventSettings.findFirst({
    where: {
      sections: {
        path: ["mediaUploadToken"],
        equals: uploadToken,
      },
    },
    include: {
      event: {
        include: {
          theme: true,
          organization: { select: { logoUrl: true, slug: true } },
        },
      },
    },
  });

  if (!settings?.event || settings.event.deletedAt) {
    return null;
  }

  return { ...settings.event, settings };
}

async function assertGuestPhotoUploadAllowed(event: {
  id: string;
  status: EventStatus;
  date?: Date | null;
  endDate?: Date | null;
  startTime?: string | null;
  endTime?: string | null;
  liveStartedAt?: Date | null;
  pausedAt?: Date | null;
  stoppedAt?: Date | null;
  lockedAt?: Date | null;
}) {
  if (!isGuestPhotoUploadAllowed(event)) {
    if (isEventEnded(event)) {
      await revokeGuestConnectIfEnded(event.id);
      throw new MediaServiceError("Event has ended", 403, "EVENT_ENDED");
    }
    if (event.pausedAt) {
      throw new MediaServiceError(
        "Event is paused",
        403,
        "EVENT_PAUSED",
      );
    }
    throw new MediaServiceError(
      "Event has not started yet",
      403,
      "EVENT_NOT_STARTED",
    );
  }
}

/** Ensures an album upload token exists. Does not require the event to have started. */
async function ensureUploadToken(eventId: string): Promise<string> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    select: {
      settings: true,
    },
  });

  if (!event?.settings) {
    throw new MediaServiceError("Event settings not found", 404, "SETTINGS_NOT_FOUND");
  }

  const sections = (event.settings.sections ?? {}) as EventSections;

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

    if (isEventWaiting(event)) {
      return null;
    }

    if (isEventEnded(event)) {
      await revokeGuestConnectIfEnded(event.id);
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
    challengeId?: string | null,
    durationMs?: number | null,
    thumbnail?: File | null,
  ) {
    const event = await getEventByUploadToken(uploadToken);

    if (!event) {
      throw new MediaServiceError("Invalid upload token", 404, "INVALID_TOKEN");
    }

    await assertGuestPhotoUploadAllowed(event);

    if (!event.settings?.enableGallery) {
      throw new MediaServiceError("Gallery uploads are disabled", 403, "GALLERY_DISABLED");
    }

    const rawMime = stripMimeParams(file.type);
    const isVideo = rawMime.startsWith("video/");
    const isImage = rawMime.startsWith("image/");

    if (!ALLOWED_TYPES.includes(rawMime)) {
      throw new MediaServiceError("Invalid file type", 400, "INVALID_FILE_TYPE");
    }

    const moderation = getModerationFromSections(event.settings.sections);
    const premium = isEventPremium(event);

    if (isVideo && (!premium || !moderation.allowVideos)) {
      throw new MediaServiceError(
        premium ? "Video uploads are disabled" : "Video uploads require Plus",
        403,
        premium ? "VIDEOS_DISABLED" : "PLUS_REQUIRED_VIDEO",
      );
    }
    if (isImage && !moderation.allowPhotos) {
      throw new MediaServiceError("Photo uploads are disabled", 403, "PHOTOS_DISABLED");
    }

    if (!premium && isImage) {
      const photoCount = await prisma.media.count({
        where: {
          eventId: event.id,
          mimeType: { startsWith: "image/" },
        },
      });
      if (photoCount >= FREE_PHOTO_CAP) {
        throw new MediaServiceError(
          `Free events allow up to ${FREE_PHOTO_CAP} photos`,
          403,
          "FREE_PHOTO_CAP",
        );
      }
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      throw new MediaServiceError(
        isVideo ? "File too large (max 50MB)" : "File too large (max 10MB)",
        400,
        "FILE_TOO_LARGE",
      );
    }

    if (isVideo) {
      const duration = Math.round(Number(durationMs));
      if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_VIDEO_DURATION_MS) {
        throw new MediaServiceError(
          "Video must be between 1 and 30 seconds",
          400,
          "INVALID_DURATION",
        );
      }
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    let buffer: Buffer;
    let contentType: string;
    if (isVideo) {
      const converted = await maybeTranscodeVideoToMp4(rawBuffer, rawMime);
      buffer = converted.buffer;
      contentType = converted.contentType;
    } else {
      const normalized = await normalizeImageBuffer(rawBuffer, rawMime);
      buffer = normalized.buffer;
      contentType = normalized.contentType;
    }
    const ext = extensionForContentType(contentType, isVideo);
    const mediaId = nanoid(12);
    const storageKey = `media/${event.slug}/${mediaId}.${ext}`;

    const storage = getStorageProvider();
    const storedKey = await storage.upload(storageKey, buffer, { contentType });

    let thumbnailKey: string | null = null;
    if (isVideo && thumbnail) {
      const thumbMime = stripMimeParams(thumbnail.type);
      if (ALLOWED_IMAGE_TYPES.includes(thumbMime) && thumbnail.size <= MAX_IMAGE_SIZE) {
        const thumbRaw = Buffer.from(await thumbnail.arrayBuffer());
        const oriented = await normalizeImageBuffer(thumbRaw, thumbMime);
        const thumbExt = extensionForContentType(oriented.contentType, false);
        const thumbStorageKey = `media/${event.slug}/${mediaId}.poster.${thumbExt}`;
        thumbnailKey = await storage.upload(thumbStorageKey, oriented.buffer, {
          contentType: oriented.contentType,
        });
      }
    }

    const requireManualApproval = event.settings?.requireManualApproval ?? false;
    const rawChallenge = challengeId?.trim() || null;
    let normalizedChallenge: string | null = null;
    if (rawChallenge) {
      const enabledGames = await prisma.eventGame.findMany({
        where: { eventId: event.id, enabled: true },
        select: { id: true, presetKey: true },
      });
      if (enabledGames.length > 0) {
        const matched = enabledGames.find(
          (game) => game.id === rawChallenge || game.presetKey === rawChallenge,
        );
        if (matched) {
          normalizedChallenge = matched.presetKey ?? matched.id;
        }
      } else if (isAlbumChallengeId(rawChallenge)) {
        normalizedChallenge = rawChallenge;
      }
    }

    const media = await prisma.media.create({
      data: {
        eventId: event.id,
        uploadToken: nanoid(21),
        storageKey: storedKey,
        thumbnailKey,
        mimeType: contentType,
        fileName: `${mediaId}.${ext}`,
        fileSize: buffer.length,
        caption: caption ?? null,
        challengeId: normalizedChallenge,
        status: requireManualApproval ? MediaStatus.PENDING : MediaStatus.APPROVED,
        uploadedBy: uploadedBy ?? null,
      },
    });

    void mediaProcessingQueue
      .add("process-media", { mediaId: media.id })
      .catch(() => {
        // Queue unavailable — media stays pending for manual moderation
      });

    const orgSlug = event.organization?.slug;
    if (orgSlug) {
      const {
        enqueueNotification,
        eventMediaLink,
        eventModLink,
        NotificationType,
        notificationService,
      } = await import("@/server/notifications/emit");
      if (media.status === MediaStatus.PENDING) {
        enqueueNotification(() =>
          notificationService.notifyMediaPendingThrottled(event.id, {
            title: "Photos awaiting approval",
            body: `${event.name}: new media needs moderation`,
            link: eventModLink(event.id),
          }),
        );
      } else {
        enqueueNotification(() =>
          notificationService.notifyEventStakeholders(event.id, {
            type: NotificationType.NEW_PHOTO,
            title: "New photo uploaded",
            body: event.name,
            link: eventMediaLink(orgSlug, event.id),
          }),
        );
      }
    }

    return {
      id: media.id,
      status: media.status,
      fileName: media.fileName,
    };
  },

  async uploadHost(userId: string, eventId: string, file: File, caption?: string) {
    await enforceEventAccess(userId, eventId, "media:manage");

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: { settings: true },
    });

    if (!event) {
      throw new MediaServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const rawMime = stripMimeParams(file.type);
    if (!ALLOWED_IMAGE_TYPES.includes(rawMime)) {
      throw new MediaServiceError("Invalid file type", 400, "INVALID_FILE_TYPE");
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new MediaServiceError("File too large (max 10MB)", 400, "FILE_TOO_LARGE");
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const { buffer, contentType } = await normalizeImageBuffer(rawBuffer, rawMime);
    const ext = extensionForContentType(contentType, false);
    const mediaId = nanoid(12);
    const storageKey = `media/${event.slug}/${mediaId}.${ext}`;

    const storage = getStorageProvider();
    const storedKey = await storage.upload(storageKey, buffer, { contentType });

    const media = await prisma.media.create({
      data: {
        eventId: event.id,
        uploadToken: nanoid(21),
        storageKey: storedKey,
        mimeType: contentType,
        fileName: `${mediaId}.${ext}`,
        fileSize: buffer.length,
        caption: caption ?? null,
        status: MediaStatus.APPROVED,
        uploadedBy: userId,
      },
    });

    void mediaProcessingQueue
      .add("process-media", { mediaId: media.id })
      .catch(() => {
        // Queue unavailable
      });

    return {
      id: media.id,
      status: media.status,
      fileName: media.fileName,
      mimeType: media.mimeType,
      caption: media.caption,
      createdAt: media.createdAt.toISOString(),
      url: storage.getPublicUrl(storedKey),
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
      thumbnailUrl: item.thumbnailKey
        ? storage.getPublicUrl(item.thumbnailKey)
        : null,
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

  async deleteMedia(
    userId: string,
    eventId: string,
    mediaId: string,
    ipAddress?: string,
  ): Promise<void> {
    const access = await enforceEventAccess(userId, eventId, "media:manage");

    const media = await prisma.media.findFirst({
      where: { id: mediaId, eventId },
    });

    if (!media) {
      throw new MediaServiceError("Media not found", 404, "MEDIA_NOT_FOUND");
    }

    const storage = getStorageProvider();
    try {
      await storage.delete(media.storageKey);
    } catch {
      // Storage miss or transient failure — still remove DB row so the UI stays consistent.
    }
    if (media.thumbnailKey) {
      try {
        await storage.delete(media.thumbnailKey);
      } catch {
        // ignore
      }
    }

    await prisma.media.delete({ where: { id: mediaId } });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "Media",
      entityId: mediaId,
      metadata: { action: "delete" },
      ipAddress,
    });
  },

  async getWallMedia(eventSlug: string, since?: Date) {
    const event = await eventRepository.findBySlugPublic(eventSlug);

    if (!event?.settings?.enableWall) {
      return [];
    }

    if (event.mediaPanicAt) {
      return [];
    }

    if (!isGuestLiveFeaturesAllowed(event)) {
      if (isEventEnded(event)) {
        await revokeGuestConnectIfEnded(event.id);
      }
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
      include: {
        reactions: {
          select: { emoji: true },
        },
      },
    });

    return items.map((item) => ({
      id: item.id,
      url: storage.getPublicUrl(item.storageKey),
      thumbnailUrl: item.thumbnailKey
        ? storage.getPublicUrl(item.thumbnailKey)
        : null,
      caption: item.caption,
      uploadedBy: item.uploadedBy,
      isFeatured: item.isFeatured,
      mimeType: item.mimeType,
      createdAt: item.createdAt.toISOString(),
      reactionCounts: aggregateReactionCounts(item.reactions),
    }));
  },

  async getWallRemovedMediaIds(eventSlug: string, since: Date): Promise<string[]> {
    const event = await eventRepository.findBySlugPublic(eventSlug);
    if (!event?.settings?.enableWall) {
      return [];
    }

    if (!isGuestLiveFeaturesAllowed(event)) {
      return [];
    }

    const items = await prisma.media.findMany({
      where: {
        eventId: event.id,
        status: MediaStatus.REJECTED,
        updatedAt: { gt: since },
      },
      select: { id: true },
      take: 100,
    });

    return items.map((item) => item.id);
  },

  async getAllWallMedia(eventSlug: string) {
    const event = await eventRepository.findBySlugPublic(eventSlug);

    if (!event?.settings?.enableWall) {
      return [];
    }

    if (event.mediaPanicAt) {
      return [];
    }

    if (!isGuestLiveFeaturesAllowed(event)) {
      if (isEventEnded(event)) {
        await revokeGuestConnectIfEnded(event.id);
      }
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
      include: {
        reactions: {
          select: { emoji: true },
        },
      },
    });

    return items.map((item) => ({
      id: item.id,
      url: storage.getPublicUrl(item.storageKey),
      thumbnailUrl: item.thumbnailKey
        ? storage.getPublicUrl(item.thumbnailKey)
        : null,
      caption: item.caption,
      uploadedBy: item.uploadedBy,
      isFeatured: item.isFeatured,
      mimeType: item.mimeType,
      createdAt: item.createdAt.toISOString(),
      reactionCounts: aggregateReactionCounts(item.reactions),
    }));
  },

  async getWallReactions(eventSlug: string, since?: Date) {
    const event = await eventRepository.findBySlugPublic(eventSlug);

    if (!event?.settings?.enableWall) {
      return { events: [], countsByMedia: {} as Record<string, Record<string, number>>, latestCreatedAt: null as Date | null };
    }

    if (!isGuestLiveFeaturesAllowed(event)) {
      return { events: [], countsByMedia: {} as Record<string, Record<string, number>>, latestCreatedAt: null as Date | null };
    }

    const items = await prisma.mediaReaction.findMany({
      where: {
        eventId: event.id,
        ...(since ? { createdAt: { gt: since } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    const mediaIds = [...new Set(items.map((item) => item.mediaId))];
    const countsByMedia: Record<string, Record<string, number>> = {};

    if (mediaIds.length > 0) {
      const grouped = await prisma.mediaReaction.groupBy({
        by: ["mediaId", "emoji"],
        where: {
          eventId: event.id,
          mediaId: { in: mediaIds },
        },
        _count: { _all: true },
      });

      for (const row of grouped) {
        if (!countsByMedia[row.mediaId]) {
          countsByMedia[row.mediaId] = {};
        }
        countsByMedia[row.mediaId]![row.emoji] = row._count._all;
      }

      // Ensure touched media include zeroed known emojis when all reactions removed
      for (const mediaId of mediaIds) {
        if (!countsByMedia[mediaId]) {
          countsByMedia[mediaId] = {};
        }
      }
    }

    return {
      events: items.map((item) => ({
        type: "reaction" as const,
        id: item.id,
        mediaId: item.mediaId,
        emoji: item.emoji,
        createdAt: item.createdAt.toISOString(),
      })),
      countsByMedia,
      latestCreatedAt: items.length > 0 ? items[items.length - 1]!.createdAt : null,
    };
  },

  async getWallReactionCountMap(eventSlug: string) {
    const event = await eventRepository.findBySlugPublic(eventSlug);
    if (!event?.settings?.enableWall || !isGuestLiveFeaturesAllowed(event)) {
      return {} as Record<string, Record<string, number>>;
    }

    const grouped = await prisma.mediaReaction.groupBy({
      by: ["mediaId", "emoji"],
      where: { eventId: event.id },
      _count: { _all: true },
    });

    const countsByMedia: Record<string, Record<string, number>> = {};
    for (const row of grouped) {
      if (!countsByMedia[row.mediaId]) {
        countsByMedia[row.mediaId] = {};
      }
      countsByMedia[row.mediaId]![row.emoji] = row._count._all;
    }
    return countsByMedia;
  },

  async addAlbumReaction(
    albumToken: string,
    mediaId: string,
    emoji: string,
    reactorKey: string,
  ) {
    if (!WALL_REACTION_EMOJIS.includes(emoji as (typeof WALL_REACTION_EMOJIS)[number])) {
      throw new MediaServiceError("Invalid reaction emoji", 400, "INVALID_EMOJI");
    }

    const key = reactorKey.trim();
    if (!key || key.length > 128) {
      throw new MediaServiceError("Invalid reactor", 400, "INVALID_REACTOR");
    }

    const event = await getEventByUploadToken(albumToken);

    if (!event?.settings || event.settings.isPublic !== true) {
      throw new MediaServiceError("Album not found", 404, "ALBUM_NOT_FOUND");
    }

    const moderation = getModerationFromSections(event.settings.sections);
    const wall = getWallSettingsFromSections(event.settings.sections);

    if (moderation.albumPermission === "upload_only") {
      throw new MediaServiceError("Album viewing is disabled", 404, "ALBUM_VIEW_DISABLED");
    }

    if (moderation.disableLikes || wall.hideLikes) {
      throw new MediaServiceError("Reactions are disabled", 403, "REACTIONS_DISABLED");
    }

    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        eventId: event.id,
        status: { in: [MediaStatus.APPROVED, MediaStatus.FEATURED] },
      },
    });

    if (!media) {
      throw new MediaServiceError("Media not found", 404, "MEDIA_NOT_FOUND");
    }

    const existing = await prisma.mediaReaction.findUnique({
      where: {
        mediaId_reactorKey_emoji: { mediaId, reactorKey: key, emoji },
      },
    });

    if (existing) {
      await prisma.mediaReaction.delete({ where: { id: existing.id } });
      return {
        type: "reaction" as const,
        id: existing.id,
        mediaId,
        emoji,
        createdAt: existing.createdAt.toISOString(),
        removed: true as const,
      };
    }

    const reaction = await prisma.mediaReaction.create({
      data: {
        mediaId,
        eventId: event.id,
        emoji,
        reactorKey: key,
      },
    });

    return {
      type: "reaction" as const,
      id: reaction.id,
      mediaId: reaction.mediaId,
      emoji: reaction.emoji,
      createdAt: reaction.createdAt.toISOString(),
    };
  },

  /** @deprecated Use addAlbumReaction with album token */
  async addWallReaction(eventSlug: string, mediaId: string, emoji: string) {
    const event = await eventRepository.findBySlugPublic(eventSlug);
    if (!event) {
      throw new MediaServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }
    const token = await ensureUploadToken(event.id);
    return this.addAlbumReaction(token, mediaId, emoji, `legacy-${eventSlug}`);
  },

  async getAlbumAccessByToken(albumToken: string) {
    const event = await getEventByUploadToken(albumToken);

    if (!event?.settings || event.settings.isPublic !== true) {
      throw new MediaServiceError("Album not found", 404, "ALBUM_NOT_FOUND");
    }

    const moderation = getModerationFromSections(event.settings.sections);
    const waiting = isEventWaiting(event);
    const canUpload =
      isGuestPhotoUploadAllowed(event) &&
      event.settings.enableGallery &&
      moderation.albumPermission !== "view_only";
    const canView = moderation.albumPermission !== "upload_only";

    return {
      albumToken,
      eventId: event.id,
      eventSlug: event.slug,
      eventName: event.name,
      uploadToken: canUpload ? albumToken : null,
      canUpload,
      canView,
      albumPermission: moderation.albumPermission,
      waiting,
    };
  },

  async getAlbumFeed(albumToken: string) {
    const event = await getEventByUploadToken(albumToken);

    if (!event?.settings || event.settings.isPublic !== true) {
      throw new MediaServiceError("Album not found", 404, "ALBUM_NOT_FOUND");
    }

    const moderation = getModerationFromSections(event.settings.sections);
    const wall = getWallSettingsFromSections(event.settings.sections);
    const appearance = getAppearanceFromSections(event.settings.sections);

    const uploadOnly = moderation.albumPermission === "upload_only";
    const waiting = isEventWaiting(event);
    const panic = Boolean(event.mediaPanicAt);
    const canUpload =
      isGuestPhotoUploadAllowed(event) &&
      !panic &&
      event.settings.enableGallery &&
      moderation.albumPermission !== "view_only";

    // Upload-only: allow a minimal payload so the guest upload shell can load
    // without exposing the gallery feed.
    if (uploadOnly) {
      return {
        eventName: event.name,
        canUpload,
        waiting,
        enableVoiceWishes: false,
        enableSongRequests: false,
        reactionsEnabled: false,
        disableGuestDownload: true,
        uploadToken: canUpload ? albumToken : null,
        takenNames: [] as string[],
        allowPhotos: moderation.allowPhotos,
        allowVideos: moderation.allowVideos,
        appearance: {
          displayLanguage: appearance.displayLanguage,
          welcomeScreenEnabled: appearance.welcomeScreenEnabled,
          welcomeScreenTitle: appearance.welcomeScreenTitle,
          welcomeScreenMessage: appearance.welcomeScreenMessage,
          removeBranding: appearance.removeBranding,
          captionTheme: appearance.captionTheme,
        },
        theme: {
          primaryColor: event.theme?.primaryColor ?? "#C4A574",
          secondaryColor: event.theme?.secondaryColor ?? "#F59E0B",
          accentColor: event.theme?.accentColor ?? "#E8C9A0",
          logoUrl: event.theme?.logoUrl ?? null,
          albumBackgroundUrl: null as string | null,
          coverImageUrl: null as string | null,
        },
        branding: {
          watermarkUrl: event.organization?.logoUrl ?? null,
        },
        games: [] as Array<{
          id: string;
          title: string;
          description: string | null;
          presetKey: string | null;
          mode: "photo" | "collage";
          coverImage: string | null;
          fields: unknown;
        }>,
        items: [] as Array<{
          id: string;
          url: string;
          thumbnailUrl: string | null;
          caption: string | null;
          uploadedBy: string | null;
          mimeType: string;
          challengeId: string | null;
          createdAt: string;
          reactionCounts: Record<string, number>;
        }>,
        uploadOnly: true as const,
      };
    }

    const reactionsEnabled = !moderation.disableLikes && !wall.hideLikes;
    const storage = getStorageProvider();

    const [items, takenNameRows, games] = await Promise.all([
      panic
        ? Promise.resolve([])
        : prisma.media.findMany({
            where: {
              eventId: event.id,
              status: { in: [MediaStatus.APPROVED, MediaStatus.FEATURED] },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
            include: {
              reactions: {
                select: { emoji: true },
              },
            },
          }),
      prisma.media.findMany({
        where: {
          eventId: event.id,
          status: { in: [MediaStatus.APPROVED, MediaStatus.FEATURED] },
          uploadedBy: { not: null },
        },
        select: { uploadedBy: true },
        distinct: ["uploadedBy"],
      }),
      prisma.eventGame.findMany({
        where: { eventId: event.id, enabled: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const takenNames = takenNameRows
      .map((row) => row.uploadedBy?.trim())
      .filter((name): name is string => Boolean(name));

    const coverImageUrl = event.theme?.coverImageKey
      ? storage.getPublicUrl(event.theme.coverImageKey)
      : null;

    return {
      eventName: event.name,
      canUpload,
      waiting,
      panic,
      enableVoiceWishes: event.settings.enableVoiceWishes ?? true,
      enableSongRequests: event.settings.enableSongRequests ?? true,
      reactionsEnabled,
      disableGuestDownload: moderation.disableGuestDownload,
      uploadToken: canUpload ? albumToken : null,
      takenNames,
      allowPhotos: moderation.allowPhotos,
      allowVideos: moderation.allowVideos,
      appearance: {
        displayLanguage: appearance.displayLanguage,
        welcomeScreenEnabled: appearance.welcomeScreenEnabled,
        welcomeScreenTitle: appearance.welcomeScreenTitle,
        welcomeScreenMessage: appearance.welcomeScreenMessage,
        removeBranding: appearance.removeBranding,
        captionTheme: appearance.captionTheme,
      },
      theme: {
        primaryColor: event.theme?.primaryColor ?? "#C4A574",
        secondaryColor: event.theme?.secondaryColor ?? "#F59E0B",
        accentColor: event.theme?.accentColor ?? "#E8C9A0",
        logoUrl: event.theme?.logoUrl ?? null,
        albumBackgroundUrl: event.theme?.albumBackgroundUrl ?? coverImageUrl,
        coverImageUrl,
      },
      branding: {
        watermarkUrl: event.organization?.logoUrl ?? null,
      },
      games: games.map((game) => ({
        id: game.id,
        title: game.title,
        description: game.description,
        presetKey: game.presetKey,
        mode:
          game.mode === "collage" || game.presetKey === "collage" ? ("collage" as const) : ("photo" as const),
        coverImage: game.coverImage,
        fields: game.fields,
      })),
      items: items.map((item) => ({
        id: item.id,
        url: storage.getPublicUrl(item.storageKey),
        thumbnailUrl: item.thumbnailKey
          ? storage.getPublicUrl(item.thumbnailKey)
          : null,
        caption: item.caption,
        uploadedBy: item.uploadedBy,
        mimeType: item.mimeType,
        challengeId: item.challengeId,
        createdAt: item.createdAt.toISOString(),
        reactionCounts: aggregateReactionCounts(item.reactions),
      })),
    };
  },

  async setWallAnnouncement(
    userId: string,
    eventId: string,
    input: { title: string; body: string },
    ipAddress?: string,
  ): Promise<WallAnnouncementPayload> {
    const access = await enforceEventAccess(userId, eventId, "event:update");

    const settings = await prisma.eventSettings.findUnique({
      where: { eventId },
    });
    if (!settings) {
      throw new MediaServiceError("Event settings not found", 404, "SETTINGS_NOT_FOUND");
    }

    const now = Date.now();
    const moderation = getModerationFromSections(settings.sections);
    const durationSec = clampAnnouncementDurationSec(moderation.announcementDurationSec);
    const announcement: WallAnnouncementPayload = {
      id: nanoid(12),
      title: input.title.trim(),
      body: input.body.trim(),
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + WALL_ANNOUNCEMENT_TTL_MS).toISOString(),
      durationSec,
    };

    const sections = {
      ...((settings.sections ?? {}) as Record<string, unknown>),
      wallAnnouncement: announcement,
    };

    await prisma.eventSettings.update({
      where: { eventId },
      data: { sections: sections as unknown as Prisma.InputJsonValue },
    });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "EventSettings",
      entityId: settings.id,
      metadata: { wallAnnouncement: { id: announcement.id } },
      ipAddress,
    });

    return announcement;
  },

  async getWallAnnouncement(eventSlug: string): Promise<WallAnnouncementPayload | null> {
    const event = await eventRepository.findBySlugPublic(eventSlug);
    if (!event?.settings) return null;
    return getWallAnnouncementFromSections(event.settings.sections);
  },
};
