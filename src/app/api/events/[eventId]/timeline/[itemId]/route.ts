import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { timelineService } from "@/server/services/timeline.service";

const updateItemSchema = z
  .object({
    time: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    location: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    responsible: z.string().optional().nullable(),
    sortOrder: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

interface RouteContext {
  params: Promise<{ eventId: string; itemId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { eventId, itemId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const item = await timelineService.updateItem(
      session.user.id,
      eventId,
      itemId,
      parsed.data,
      getClientIp(request),
    );
    return apiSuccess({ item });
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
  const { eventId, itemId } = await context.params;

  try {
    const session = await requireAuth();
    await timelineService.deleteItem(
      session.user.id,
      eventId,
      itemId,
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
