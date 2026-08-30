import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { privacyService } from "@/server/services/privacy.service";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const result = await privacyService.requestDataExport(
      session.user.id,
      getClientIp(request),
    );
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
