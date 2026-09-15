import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import {
  NotificationServiceError,
  notificationService,
} from "@/server/services/notification.service";

const schema = z.object({
  ids: z.array(z.string().min(1)).optional(),
  all: z.boolean().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  if (!parsed.data.all && (!parsed.data.ids || parsed.data.ids.length === 0)) {
    return apiError("Provide ids or all: true", "VALIDATION_ERROR", 400);
  }

  try {
    const session = await requireAuth();
    const count = parsed.data.all
      ? await notificationService.markAllRead(session.user.id)
      : await notificationService.markRead(session.user.id, parsed.data.ids!);

    return apiSuccess({ count });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof NotificationServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
