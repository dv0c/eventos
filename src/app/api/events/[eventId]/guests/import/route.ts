import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";
import { importService } from "@/server/services/import.service";
import { planLimitsService } from "@/server/services/plan-limits.service";
import type { ImportGuestRow } from "@/server/services/import.service";

const commitSchema = z.object({
  action: z.literal("commit"),
  rows: z.array(
    z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      family: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      isVip: z.boolean().optional(),
      plusOne: z.boolean().optional(),
      children: z.number().optional(),
      partySize: z.number().optional(),
    }),
  ),
  skipDuplicates: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const session = await requireAuth();
    const access = await enforceEventAccess(session.user.id, eventId, "guest:import");

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const action = formData.get("action") ?? "preview";
      const mappingRaw = formData.get("mapping");

      if (!(file instanceof File)) {
        return apiError("File is required", "FILE_REQUIRED", 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const customMapping = mappingRaw
        ? (JSON.parse(String(mappingRaw)) as Record<string, keyof ImportGuestRow | null>)
        : undefined;

      if (action === "commit") {
        const rowsRaw = formData.get("rows");
        if (!rowsRaw) {
          return apiError("Rows required for commit", "ROWS_REQUIRED", 400);
        }
        const rows = JSON.parse(String(rowsRaw)) as ImportGuestRow[];
        await planLimitsService.assertWithinLimit(access.organizationId, "guests", rows.length);
        const result = await importService.commit(eventId, rows, true);
        return apiSuccess(result);
      }

      const preview = await importService.preview(
        eventId,
        buffer,
        file.name,
        customMapping,
      );
      return apiSuccess(preview);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body", "INVALID_BODY", 400);
    }

    const parsed = commitSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    await planLimitsService.assertWithinLimit(
      access.organizationId,
      "guests",
      parsed.data.rows.length,
    );

    const result = await importService.commit(
      eventId,
      parsed.data.rows,
      parsed.data.skipDuplicates ?? true,
    );
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
