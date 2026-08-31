import { AuditAction } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";
import { eventRepository } from "@/server/repositories/event.repository";
import { auditService } from "@/server/services/audit.service";

const updateEventSettingsSchema = z
  .object({
    isPublic: z.boolean().optional(),
    allowRsvp: z.boolean().optional(),
    enableGallery: z.boolean().optional(),
    enableWall: z.boolean().optional(),
    indexable: z.boolean().optional(),
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

    const settings = await prisma.eventSettings.update({
      where: { eventId },
      data: parsed.data,
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

    return apiSuccess({ settings });
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
