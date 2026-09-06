import { QRCodeType } from "@prisma/client";

import { apiError, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { QrServiceError, qrService } from "@/server/services/qr.service";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const download = searchParams.get("download") === "1";

  if (!typeParam || !Object.values(QRCodeType).includes(typeParam as QRCodeType)) {
    return apiError("Invalid or missing QR type", "VALIDATION_ERROR", 400);
  }

  const type = typeParam as QRCodeType;

  try {
    const session = await requireAuth();
    const pngBuffer = await qrService.renderQrImage(session.user.id, eventId, type);

    const headers = new Headers({
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    });

    if (download) {
      headers.set(
        "Content-Disposition",
        `attachment; filename="${type.toLowerCase()}-qr.png"`,
      );
    }

    return new Response(new Uint8Array(pngBuffer), { status: 200, headers });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof QrServiceError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
