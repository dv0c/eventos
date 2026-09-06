import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import {
  songRequestService,
  SongRequestServiceError,
} from "@/server/services/song-request.service";

interface RouteContext {
  params: Promise<{ eventId: string; songId: string }>;
}

const patchSchema = z.object({
  action: z.enum(["approve", "reject", "play", "played", "skip"]),
});

export async function PATCH(request: Request, context: RouteContext) {
  const { eventId, songId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400);
  }

  try {
    const session = await requireAuth();
    const result = await songRequestService.updateStatus(
      session.user.id,
      eventId,
      songId,
      parsed.data.action,
    );
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof SongRequestServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { eventId, songId } = await context.params;

  try {
    const session = await requireAuth();
    await songRequestService.deleteSong(session.user.id, eventId, songId);
    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof SongRequestServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
