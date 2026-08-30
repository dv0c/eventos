import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { invitationService } from "@/server/services/invitation.service";

const sendSchema = z.object({
  guestIds: z.array(z.string()).optional(),
  sendToAll: z.boolean().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  type: z.enum(["invitation", "reminder"]).optional(),
});

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const ip = getClientIp(request);

    const result =
      parsed.data.type === "reminder"
        ? await invitationService.sendRsvpReminders(session.user.id, eventId, ip)
        : await invitationService.sendInvitations(
            session.user.id,
            eventId,
            parsed.data,
            ip,
          );

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
