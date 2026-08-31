import { z } from "zod";

import {
  apiError,
  apiSuccess,
  getClientIp,
  handleServiceError,
} from "@/lib/api-response";
import { AuthError, requireAuth, setActiveOrganization } from "@/server/auth/session";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { organizationService } from "@/server/services/organization.service";

const acceptInviteSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = acceptInviteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const member = await organizationService.acceptInvite(
      session.user.id,
      { token: parsed.data.token },
      getClientIp(request),
    );

    const organization = await organizationRepository.findById(member.organizationId);

    if (!organization) {
      return apiError("Organization not found", "ORG_NOT_FOUND", 404);
    }

    await setActiveOrganization(organization.id);

    return apiSuccess({
      member,
      organization: {
        id: organization.id,
        slug: organization.slug,
        name: organization.name,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
