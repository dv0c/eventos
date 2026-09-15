import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import {
  NotificationServiceError,
  notificationService,
} from "@/server/services/notification.service";

const schema = z.object({
  notificationId: z.string().min(1),
  action: z.enum(["accept", "decline"]),
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

  try {
    const session = await requireAuth();
    const email = session.user.email;
    if (!email) {
      return apiError("Email required", "EMAIL_REQUIRED", 400);
    }

    const result = await notificationService.respondToCollabInvite(
      session.user.id,
      email,
      parsed.data.notificationId,
      parsed.data.action,
    );

    return apiSuccess(result);
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
