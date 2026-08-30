import { MessageChannel, MessageType } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { messageService } from "@/server/services/message.service";

const sendSchema = z.object({
  action: z.enum(["send", "schedule"]).default("send"),
  type: z.nativeEnum(MessageType),
  channel: z.nativeEnum(MessageChannel).optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  guestIds: z.array(z.string()).optional(),
  sendToAll: z.boolean().optional(),
  scheduledAt: z.coerce.date().optional(),
  templateId: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const session = await requireAuth();
    const [messages, templates] = await Promise.all([
      messageService.listMessages(session.user.id, eventId),
      messageService.listTemplates(session.user.id, eventId),
    ]);

    return apiSuccess({
      messages,
      templates,
      emailConfigured: !!process.env.RESEND_API_KEY,
    });
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

  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  if (parsed.data.action === "schedule" && !parsed.data.scheduledAt) {
    return apiError("scheduledAt is required for schedule action", "VALIDATION_ERROR", 400);
  }

  try {
    const session = await requireAuth();
    const ip = getClientIp(request);

    const result = await messageService.sendOrSchedule(
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
