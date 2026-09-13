import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import {
  EventPurchaseServiceError,
  eventPurchaseService,
} from "@/server/services/event-purchase.service";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const session = await requireAuth();
    const body = (await request.json().catch(() => ({}))) as {
      orgSlug?: string;
      locale?: string;
    };
    if (!body.orgSlug) {
      return apiError("orgSlug is required", "VALIDATION_ERROR", 400);
    }

    const data = await eventPurchaseService.createUpgradeCheckout(
      session.user.id,
      eventId,
      body.orgSlug,
      body.locale ?? "el",
    );
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof EventPurchaseServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
