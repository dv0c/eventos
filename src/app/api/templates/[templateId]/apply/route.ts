import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, getActiveOrganizationId, requireAuth } from "@/server/auth/session";
import { templateService } from "@/server/services/template.service";

const applySchema = z.object({
  name: z.string().trim().min(1),
  date: z.coerce.date(),
  clientId: z.string().optional(),
  location: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ templateId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { templateId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
      return apiError("No active organization selected", "NO_ACTIVE_ORG", 400);
    }

    const event = await templateService.cloneToEvent(
      session.user.id,
      organizationId,
      templateId,
      parsed.data,
      getClientIp(request),
    );

    return apiSuccess({ event }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { templateId } = await context.params;

  try {
    const session = await requireAuth();
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
      return apiError("No active organization selected", "NO_ACTIVE_ORG", 400);
    }

    await templateService.deleteTemplate(
      session.user.id,
      organizationId,
      templateId,
      getClientIp(request),
    );

    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
