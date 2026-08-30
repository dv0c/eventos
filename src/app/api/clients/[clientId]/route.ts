import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, getActiveOrganizationId, requireAuth } from "@/server/auth/session";
import { clientService } from "@/server/services/client.service";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

interface RouteContext {
  params: Promise<{ clientId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { clientId } = await context.params;

  try {
    const session = await requireAuth();
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
      return apiError("No active organization selected", "NO_ACTIVE_ORG", 400);
    }

    const client = await clientService.getClient(session.user.id, organizationId, clientId);
    return apiSuccess({ client });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { clientId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
      return apiError("No active organization selected", "NO_ACTIVE_ORG", 400);
    }

    const client = await clientService.updateClient(
      session.user.id,
      organizationId,
      clientId,
      parsed.data,
      getClientIp(request),
    );

    return apiSuccess({ client });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { clientId } = await context.params;

  try {
    const session = await requireAuth();
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
      return apiError("No active organization selected", "NO_ACTIVE_ORG", 400);
    }

    await clientService.deleteClient(
      session.user.id,
      organizationId,
      clientId,
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
