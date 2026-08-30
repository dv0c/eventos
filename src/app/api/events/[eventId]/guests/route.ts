import { GuestStatus } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { guestService } from "@/server/services/guest.service";

const createGuestSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  family: z.string().optional().nullable(),
  plusOne: z.boolean().optional(),
  plusOneName: z.string().optional().nullable(),
  children: z.number().int().min(0).optional(),
  partySize: z.number().int().min(1).optional(),
  status: z.nativeEnum(GuestStatus).optional(),
  dietaryRequirements: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isVip: z.boolean().optional(),
  groupId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

const listQuerySchema = z.object({
  status: z.nativeEnum(GuestStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(["createdAt", "lastName", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const bulkDeleteSchema = z.object({
  guestIds: z.array(z.string()).min(1),
});

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const { searchParams } = new URL(request.url);
  const parsed = listQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortOrder: searchParams.get("sortOrder") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const result = await guestService.listGuests(session.user.id, eventId, parsed.data);
    return apiSuccess(result);
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

export async function POST(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = createGuestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const guest = await guestService.createGuest(
      session.user.id,
      eventId,
      parsed.data,
      getClientIp(request),
    );
    return apiSuccess({ guest }, 201);
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = bulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const count = await guestService.bulkDeleteGuests(
      session.user.id,
      eventId,
      parsed.data.guestIds,
      getClientIp(request),
    );
    return apiSuccess({ deleted: count });
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
