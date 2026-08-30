import { AuditAction, EventStatus, EventType } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";
import { eventRepository } from "@/server/repositories/event.repository";
import { prisma } from "@/server/db";
import { auditService } from "@/server/services/audit.service";

const updateEventSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    type: z.nativeEnum(EventType).optional(),
    status: z.nativeEnum(EventStatus).optional(),
    description: z.string().nullable().optional(),
    date: z.coerce.date().optional(),
    startTime: z.string().nullable().optional(),
    endTime: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    hostName: z.string().nullable().optional(),
    hostPhone: z.string().nullable().optional(),
    hostEmail: z.email().nullable().optional(),
    clientId: z.string().nullable().optional(),
    expectedGuests: z.number().int().min(0).optional(),
    expectedCouples: z.number().int().min(0).optional(),
    expectedChildren: z.number().int().min(0).optional(),
    expectedVip: z.number().int().min(0).optional(),
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
    const access = await enforceEventAccess(session.user.id, eventId, "event:read");
    const event = await eventRepository.findById(access.organizationId, eventId);

    if (!event) {
      return apiError("Event not found", "EVENT_NOT_FOUND", 404);
    }

    return apiSuccess({ event });
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

  const parsed = updateEventSchema.safeParse(body);
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

    const event = await prisma.event.update({
      where: { id: eventId },
      data: parsed.data,
      include: {
        settings: true,
        theme: true,
        client: true,
      },
    });

    await auditService.logAudit({
      userId: session.user.id,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "Event",
      entityId: eventId,
      metadata: parsed.data,
      ipAddress: getClientIp(request),
    });

    return apiSuccess({ event });
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
