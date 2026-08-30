import { z } from "zod";

import {
  apiError,
  apiSuccess,
  getClientIp,
  handleServiceError,
} from "@/lib/api-response";
import { AuthError, getActiveOrganizationId, requireAuth } from "@/server/auth/session";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { organizationService } from "@/server/services/organization.service";

const createOrganizationSchema = z.object({
  name: z.string().trim().min(1),
  planSlug: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const organizations = await organizationRepository.getUserOrganizations(
      session.user.id,
    );
    const activeOrganizationId = await getActiveOrganizationId();

    return apiSuccess({
      organizations,
      activeOrganizationId,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = createOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const organization = await organizationService.createOrganization(
      session.user.id,
      parsed.data,
      getClientIp(request),
    );

    return apiSuccess({ organization }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
