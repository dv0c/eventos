import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { seatingService } from "@/server/services/seating.service";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const session = await requireAuth();
    const result = await seatingService.suggestSeating(session.user.id, eventId);
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
