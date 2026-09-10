import { AuditAction, EventStatus, EventType } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";
import { eventRepository } from "@/server/repositories/event.repository";
import { prisma } from "@/server/db";
import { auditService } from "@/server/services/audit.service";
import { eventService } from "@/server/services/event.service";

const updateEventSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    type: z.nativeEnum(EventType).optional(),
    status: z.nativeEnum(EventStatus).optional(),
    description: z.string().nullable().optional(),
    date: z.coerce.date().optional(),
    endDate: z.coerce.date().nullable().optional(),
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
    theme: z
      .object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        style: z.string().optional(),
        coverImageKey: z.string().nullable().optional(),
        logoUrl: z.string().url().nullable().optional(),
        albumBackgroundUrl: z.string().url().nullable().optional(),
      })
      .optional(),
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

    const { theme, ...eventData } = parsed.data;

    if (theme) {
      await prisma.eventTheme.upsert({
        where: { eventId },
        create: {
          eventId,
          primaryColor: theme.primaryColor ?? "#C4A574",
          secondaryColor: theme.secondaryColor ?? "#F59E0B",
          accentColor: theme.accentColor ?? "#E8C9A0",
          style: theme.style ?? "elegant",
          coverImageKey: theme.coverImageKey ?? null,
          logoUrl: theme.logoUrl ?? null,
          albumBackgroundUrl: theme.albumBackgroundUrl ?? null,
        },
        update: {
          ...(theme.primaryColor !== undefined ? { primaryColor: theme.primaryColor } : {}),
          ...(theme.secondaryColor !== undefined
            ? { secondaryColor: theme.secondaryColor }
            : {}),
          ...(theme.accentColor !== undefined ? { accentColor: theme.accentColor } : {}),
          ...(theme.style !== undefined ? { style: theme.style } : {}),
          ...(theme.coverImageKey !== undefined
            ? { coverImageKey: theme.coverImageKey }
            : {}),
          ...(theme.logoUrl !== undefined ? { logoUrl: theme.logoUrl } : {}),
          ...(theme.albumBackgroundUrl !== undefined
            ? { albumBackgroundUrl: theme.albumBackgroundUrl }
            : {}),
        },
      });
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: eventData,
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

export async function DELETE(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const session = await requireAuth();
    await eventService.deleteEvent(session.user.id, eventId, getClientIp(request));
    return apiSuccess({ deleted: true });
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
