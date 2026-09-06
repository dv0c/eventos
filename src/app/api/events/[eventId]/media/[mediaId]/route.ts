import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { mediaService } from "@/server/services/media.service";

interface RouteContext {
  params: Promise<{ eventId: string; mediaId: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  const { eventId, mediaId } = await context.params;

  try {
    const session = await requireAuth();
    await mediaService.deleteMedia(session.user.id, eventId, mediaId, getClientIp(request));
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
