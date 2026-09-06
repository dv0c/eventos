import { z } from "zod";

import {
  apiError,
  apiSuccess,
  getClientIp,
  handleServiceError,
} from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { organizationService } from "@/server/services/organization.service";

const updateOrganizationSchema = z.object({
  logoUrl: z.string().url().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = updateOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const organization = await organizationService.updateLogoUrl(
      session.user.id,
      orgId,
      parsed.data.logoUrl,
      getClientIp(request),
    );

    return apiSuccess({ organization });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
