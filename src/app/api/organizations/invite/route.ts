import { OrgRole } from "@prisma/client";
import { z } from "zod";

import {
  apiError,
  apiSuccess,
  getClientIp,
  handleServiceError,
} from "@/lib/api-response";
import { AuthError, getActiveOrganizationId, requireAuth } from "@/server/auth/session";
import { organizationService } from "@/server/services/organization.service";

const inviteMemberSchema = z.object({
  email: z.email(),
  role: z.nativeEnum(OrgRole).optional(),
  organizationId: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = inviteMemberSchema.safeParse(body);
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

    const invite = await organizationService.inviteMember(
      session.user.id,
      organizationId,
      {
        email: parsed.data.email,
        role: parsed.data.role,
      },
      getClientIp(request),
    );

    return apiSuccess({ invite }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
