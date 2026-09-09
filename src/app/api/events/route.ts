import { EventStatus, EventType } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, getActiveOrganizationId, requireAuth } from "@/server/auth/session";
import { eventService } from "@/server/services/event.service";

const createEventSchema = z.object({
  organizationId: z.string().optional(),
  name: z.string().trim().min(1),
  type: z.nativeEnum(EventType).optional(),
  description: z.string().optional(),
  date: z.coerce.date(),
  endDate: z.coerce.date(),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
  clientId: z.string().optional(),
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
      coverImageKey: z.string().optional(),
    })
    .optional(),
  games: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        description: z.string().nullable().optional(),
        presetKey: z.string().nullable().optional(),
        sortOrder: z.number().int().optional(),
        enabled: z.boolean().optional(),
        fields: z.unknown().optional(),
        coverImage: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

const listEventsQuerySchema = z.object({
  organizationId: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  type: z.nativeEnum(EventType).optional(),
  clientId: z.string().optional(),
  timeframe: z.enum(["active", "upcoming", "completed"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listEventsQuerySchema.safeParse({
    organizationId: searchParams.get("organizationId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    clientId: searchParams.get("clientId") ?? undefined,
    timeframe: searchParams.get("timeframe") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const organizationId =
      parsed.data.organizationId ?? (await getActiveOrganizationId());

    if (!organizationId) {
      return apiError("No active organization selected", "NO_ACTIVE_ORG", 400);
    }

    const result = await eventService.listEvents(session.user.id, {
      organizationId,
      status: parsed.data.status,
      type: parsed.data.type,
      clientId: parsed.data.clientId,
      timeframe: parsed.data.timeframe,
      search: parsed.data.search,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const organizationId =
      parsed.data.organizationId ?? (await getActiveOrganizationId());

    if (!organizationId) {
      return apiError("No active organization selected", "NO_ACTIVE_ORG", 400);
    }

    const { organizationId: _ignored, theme, games, ...eventInput } = parsed.data;
    const event = await eventService.createEvent(
      session.user.id,
      {
        ...eventInput,
        organizationId,
        theme,
        games,
      },
      getClientIp(request),
    );

    return apiSuccess({ event }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
