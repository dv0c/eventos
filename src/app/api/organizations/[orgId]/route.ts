import { z } from "zod";

import {
  apiError,
  apiSuccess,
  getClientIp,
  handleServiceError,
} from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { organizationService } from "@/server/services/organization.service";

const updateOrganizationSchema = z
  .object({
    logoUrl: z.string().url().nullable().optional(),
    name: z.string().trim().min(1).max(120).optional(),
    brandName: z.string().trim().min(1).max(120).nullable().optional(),
    primaryColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
      .nullable()
      .optional(),
    secondaryColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
      .nullable()
      .optional(),
    mode: z.literal("B2B").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
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
    const organization = await organizationService.updateBranding(
      session.user.id,
      orgId,
      parsed.data,
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
