import { AuditAction, type Prisma } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db";
import {
  getAppearanceFromSections,
  getModerationFromSections,
  mergeSectionsAppearance,
  mergeSectionsModeration,
} from "@/server/events/wall-settings";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";
import { eventRepository } from "@/server/repositories/event.repository";
import { auditService } from "@/server/services/audit.service";

const appearanceSchema = z
  .object({
    displayLanguage: z.enum(["automatic", "en", "el"]).optional(),
    welcomeScreenEnabled: z.boolean().optional(),
    welcomeScreenTitle: z.string().nullable().optional(),
    welcomeScreenMessage: z.string().nullable().optional(),
    removeBranding: z.boolean().optional(),
    captionTheme: z.enum(["dark", "light"]).optional(),
    textPostsBackgroundsEnabled: z.boolean().optional(),
  })
  .optional();

const moderationSchema = z
  .object({
    requireManualApproval: z.boolean().optional(),
    contentFilterEnabled: z.boolean().optional(),
    contentFilterConfig: z
      .object({
        adult: z.boolean().optional(),
        violence: z.boolean().optional(),
        suggestive: z.boolean().optional(),
      })
      .optional(),
    allowPhotos: z.boolean().optional(),
    allowVideos: z.boolean().optional(),
    allowText: z.boolean().optional(),
    albumPermission: z.enum(["view_upload", "view_only", "upload_only"]).optional(),
    disableGuestDownload: z.boolean().optional(),
    disableLikes: z.boolean().optional(),
    announcementDurationSec: z.number().int().min(5).max(60).optional(),
  })
  .optional();

const updateEventSettingsSchema = z
  .object({
    isPublic: z.boolean().optional(),
    allowRsvp: z.boolean().optional(),
    enableGallery: z.boolean().optional(),
    enableWall: z.boolean().optional(),
    enableVoiceWishes: z.boolean().optional(),
    indexable: z.boolean().optional(),
    requireManualApproval: z.boolean().optional(),
    appearance: appearanceSchema,
    moderation: moderationSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const session = await requireAuth();
    await enforceEventAccess(session.user.id, eventId, "event:read");

    const settings = await prisma.eventSettings.findUnique({
      where: { eventId },
    });

    if (!settings) {
      return apiError("Event settings not found", "SETTINGS_NOT_FOUND", 404);
    }

    return apiSuccess({
      settings: {
        ...settings,
        appearance: getAppearanceFromSections(settings.sections),
        moderation: getModerationFromSections(settings.sections),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = updateEventSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const access = await enforceEventAccess(session.user.id, eventId, "event:update");

    const existing = await eventRepository.findById(access.organizationId, eventId);
    if (!existing) {
      return apiError("Event not found", "EVENT_NOT_FOUND", 404);
    }

    const currentSettings = await prisma.eventSettings.findUnique({
      where: { eventId },
    });

    if (!currentSettings) {
      return apiError("Event settings not found", "SETTINGS_NOT_FOUND", 404);
    }

    const { appearance, moderation, ...columnData } = parsed.data;
    let sections: Prisma.InputJsonValue = currentSettings.sections as Prisma.InputJsonValue;

    if (appearance) {
      sections = mergeSectionsAppearance(sections, appearance) as Prisma.InputJsonValue;
    }
    if (moderation) {
      sections = mergeSectionsModeration(sections, moderation) as Prisma.InputJsonValue;
      if (moderation.requireManualApproval !== undefined) {
        columnData.requireManualApproval = moderation.requireManualApproval;
      }
      if (moderation.albumPermission === "view_only") {
        columnData.enableGallery = false;
      } else if (
        moderation.albumPermission === "upload_only" ||
        moderation.albumPermission === "view_upload"
      ) {
        columnData.enableGallery = true;
      }
    }

    if (
      columnData.requireManualApproval !== undefined &&
      moderation?.requireManualApproval === undefined
    ) {
      sections = mergeSectionsModeration(sections, {
        requireManualApproval: columnData.requireManualApproval,
      }) as Prisma.InputJsonValue;
    }

    const settings = await prisma.eventSettings.update({
      where: { eventId },
      data: {
        ...columnData,
        sections,
      },
    });

    await auditService.logAudit({
      userId: session.user.id,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "EventSettings",
      entityId: settings.id,
      metadata: parsed.data,
      ipAddress: getClientIp(request),
    });

    return apiSuccess({
      settings: {
        ...settings,
        appearance: getAppearanceFromSections(settings.sections),
        moderation: getModerationFromSections(settings.sections),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
