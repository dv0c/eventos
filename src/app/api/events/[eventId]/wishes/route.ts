import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import {
  voiceWishService,
  VoiceWishServiceError,
} from "@/server/services/voice-wish.service";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const { searchParams } = new URL(request.url);
  const summaryOnly = searchParams.get("summary") === "1";

  try {
    const session = await requireAuth();
    if (summaryOnly) {
      const summary = await voiceWishService.getHostSummary(
        session.user.id,
        eventId,
      );
      return apiSuccess(summary);
    }
    const list = await voiceWishService.listForHost(session.user.id, eventId);
    return apiSuccess(list);
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
