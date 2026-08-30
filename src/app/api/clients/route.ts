import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, getActiveOrganizationId, requireAuth } from "@/server/auth/session";
import { clientService } from "@/server/services/client.service";

const createSchema = z.object({
  organizationId: z.string().optional(),
  name: z.string().trim().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
  const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined;

  try {
    const session = await requireAuth();
    const organizationId =
      searchParams.get("organizationId") ?? (await getActiveOrganizationId());

    if (!organizationId) {
      return apiError("No active organization selected", "NO_ACTIVE_ORG", 400);
    }

    const result = await clientService.listClients(session.user.id, organizationId, {
      search,
      page,
      pageSize,
    });

    return apiSuccess(result);
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

  const parsed = createSchema.safeParse(body);
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

    const client = await clientService.createClient(
      session.user.id,
      organizationId,
      parsed.data,
      getClientIp(request),
    );

    return apiSuccess({ client }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
