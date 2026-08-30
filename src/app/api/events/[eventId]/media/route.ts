import { MediaStatus } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { mediaService } from "@/server/services/media.service";

const moderateSchema = z.object({
  mediaId: z.string(),
  action: z.enum(["approve", "reject", "feature"]),
  reason: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  const status =
    statusParam && Object.values(MediaStatus).includes(statusParam as MediaStatus)
      ? (statusParam as MediaStatus)
      : undefined;

  try {
    const session = await requireAuth();
    const media = await mediaService.listMedia(session.user.id, eventId, status);
    return apiSuccess({ media });
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

  const parsed = moderateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const ip = getClientIp(request);

    const media = await mediaService.moderateMedia(
      session.user.id,
      eventId,
      parsed.data.mediaId,
      parsed.data.action,
      parsed.data.reason,
      ip,
    );

    return apiSuccess({ media });
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
