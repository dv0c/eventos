import { EventType } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { AuthError, getActiveOrganizationId, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import {
  EventPurchaseServiceError,
  eventPurchaseService,
} from "@/server/services/event-purchase.service";

const createPayloadSchema = z.object({
  organizationId: z.string().optional(),
  orgSlug: z.string().min(1),
  locale: z.string().optional(),
  name: z.string().trim().min(1),
  type: z.nativeEnum(EventType).optional(),
  description: z.string().optional(),
  date: z.string().min(1),
  startTime: z.string().nullable().optional(),
  expectedGuests: z.number().int().min(0).optional(),
  expectedCouples: z.number().int().min(0).optional(),
  expectedChildren: z.number().int().min(0).optional(),
  expectedVip: z.number().int().min(0).optional(),
  theme: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      style: z.string().optional(),
      coverImageKey: z.string().optional(),
    })
    .optional(),
  games: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        description: z.string().nullable().optional(),
        presetKey: z.string().nullable().optional(),
        mode: z.enum(["photo", "collage"]).optional(),
        sortOrder: z.number().int().optional(),
        enabled: z.boolean().optional(),
        fields: z.unknown().optional(),
        coverImage: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const quota = await eventPurchaseService.getQuota(session.user.id);
    return apiSuccess(quota);
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

  const parsed = createPayloadSchema.safeParse(body);
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

    const { orgSlug, locale, organizationId: _ignored, ...payload } = parsed.data;
    const data = await eventPurchaseService.createPremiumEventCheckout(
      session.user.id,
      organizationId,
      orgSlug,
      payload,
      locale ?? "el",
    );
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof EventPurchaseServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
