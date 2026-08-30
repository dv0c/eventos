import { QRCodeType } from "@prisma/client";
import { z } from "zod";

import { apiError, apiSuccess, getClientIp, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { qrService } from "@/server/services/qr.service";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const session = await requireAuth();
    const qrCodes = await qrService.listQrCodes(session.user.id, eventId);
    return apiSuccess({ qrCodes });
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

const generateSchema = z.object({
  type: z.nativeEnum(QRCodeType).optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return apiError("Invalid JSON body", "INVALID_BODY", 400);
  }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  try {
    const session = await requireAuth();
    const ip = getClientIp(request);
    const qrCodes = await qrService.generateQrCode(
      session.user.id,
      eventId,
      parsed.data.type,
      ip,
    );
    return apiSuccess({ qrCodes });
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
