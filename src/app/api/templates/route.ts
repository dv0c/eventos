import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, getActiveOrganizationId, requireAuth } from "@/server/auth/session";
import { templateService } from "@/server/services/template.service";

const createFromEventSchema = z.object({
  eventId: z.string(),
  name: z.string().trim().min(1),
  organizationId: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const session = await requireAuth();
    const organizationId =
      searchParams.get("organizationId") ?? (await getActiveOrganizationId());

    if (!organizationId) {
      return apiError("No active organization selected", "NO_ACTIVE_ORG", 400);
    }

    const templates = await templateService.listTemplates(session.user.id, organizationId);
    return apiSuccess({ templates });
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

  const parsed = createFromEventSchema.safeParse(body);
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

    const template = await templateService.createFromEvent(
      session.user.id,
      organizationId,
      parsed.data.eventId,
      parsed.data.name,
      getClientIp(request),
    );

    return apiSuccess({ template }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
