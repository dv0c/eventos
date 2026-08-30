import { GuestStatus } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { guestService } from "@/server/services/guest.service";

const updateGuestSchema = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
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
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

interface RouteContext {
  params: Promise<{ eventId: string; guestId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { eventId, guestId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = updateGuestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const guest = await guestService.updateGuest(
      session.user.id,
      eventId,
      guestId,
      parsed.data,
      getClientIp(request),
    );
    return apiSuccess({ guest });
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

export async function DELETE(_request: Request, context: RouteContext) {
  const { eventId, guestId } = await context.params;

  try {
    const session = await requireAuth();
    await guestService.deleteGuest(
      session.user.id,
      eventId,
      guestId,
      getClientIp(_request),
    );
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
