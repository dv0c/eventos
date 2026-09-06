import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import {
  voiceWishService,
  VoiceWishServiceError,
} from "@/server/services/voice-wish.service";

interface RouteContext {
  params: Promise<{ eventId: string; wishId: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  const { eventId, wishId } = await context.params;

  try {
    const session = await requireAuth();
    await voiceWishService.deleteWish(
      session.user.id,
      eventId,
      wishId,
      getClientIp(request),
    );
    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof VoiceWishServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
