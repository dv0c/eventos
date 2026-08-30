import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth, setActiveOrganization } from "@/server/auth/session";
import { organizationService } from "@/server/services/organization.service";

const switchOrganizationSchema = z.object({
  organizationId: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = switchOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const organization = await organizationService.switchOrganization(
      session.user.id,
      parsed.data.organizationId,
    );

    await setActiveOrganization(organization.id);

    return apiSuccess({ organization });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
