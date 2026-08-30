import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { AuthError, getActiveOrganizationId, requireAuth } from "@/server/auth/session";
import { billingService } from "@/server/services/billing.service";

const checkoutSchema = z.object({
  planSlug: z.string(),
  interval: z.enum(["monthly", "yearly"]).optional(),
  organizationId: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const organizationId =
      parsed.data.organizationId ?? (await getActiveOrganizationId());

    if (!organizationId) {
      return apiError("No active organization selected", "NO_ACTIVE_ORG", 400);
    }

    const result = await billingService.createCheckoutSession(
      session.user.id,
      organizationId,
      parsed.data.planSlug,
      parsed.data.interval ?? "monthly",
    );

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
