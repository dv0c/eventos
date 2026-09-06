import { AuditAction, type Prisma } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db";
import {
  getWallSettingsFromSections,
  mergeSectionsWall,
  type WallDisplaySettings,
} from "@/server/events/wall-settings";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";
import { eventRepository } from "@/server/repositories/event.repository";
import { auditService } from "@/server/services/audit.service";

const wallSettingsSchema = z
  .object({
    imageDurationSec: z.number().int().min(1).max(120).optional(),
    videoDurationSec: z.number().int().min(1).max(300).optional(),
    textDurationSec: z.number().int().min(1).max(120).optional(),
    playVideoFullLength: z.boolean().optional(),
    hideSideImages: z.boolean().optional(),
    hideQrCode: z.boolean().optional(),
    hideCaption: z.boolean().optional(),
    hideNickname: z.boolean().optional(),
    hideLikes: z.boolean().optional(),
    hideMarquee: z.boolean().optional(),
    qrSize: z.enum(["sm", "md", "lg", "xl"]).optional(),
    marqueeSpeed: z.number().int().min(10).max(120).optional(),
    marqueeText: z.string().max(500).optional(),
    transitionMs: z.number().int().min(200).max(1200).optional(),
    backgroundUrl: z.string().url().nullable().optional(),
    backgroundOpacity: z.number().int().min(0).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = wallSettingsSchema.safeParse(body);
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

    const sections = mergeSectionsWall(currentSettings.sections, parsed.data);

    const settings = await prisma.eventSettings.update({
      where: { eventId },
      data: { sections: sections as Prisma.InputJsonValue },
    });

    await auditService.logAudit({
      userId: session.user.id,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "EventSettings",
      entityId: settings.id,
      metadata: { wall: parsed.data },
      ipAddress: getClientIp(request),
    });

    const wall = (sections.wall ?? {}) as WallDisplaySettings;

    return apiSuccess({ wall });
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

    const wall = getWallSettingsFromSections(settings.sections);

    return apiSuccess({ wall });
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
