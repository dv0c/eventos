import { QRCodeType } from "@prisma/client";
import QRCode from "qrcode";

import { apiError, handleServiceError } from "@/lib/api-response";
import { prisma } from "@/server/db";
import { eventRepository } from "@/server/repositories/event.repository";

interface RouteContext {
  params: Promise<{ eventSlug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { eventSlug } = await context.params;

  try {
    const event = await eventRepository.findBySlugPublic(eventSlug);

    if (!event) {
      return apiError("Event not found", "EVENT_NOT_FOUND", 404);
    }

    if (!event.settings?.enableWall) {
      return apiError("Photo wall is disabled", "WALL_DISABLED", 404);
    }

    const uploadQr = await prisma.qRCode.findFirst({
      where: { eventId: event.id, type: QRCodeType.UPLOAD },
    });

    if (!uploadQr) {
      return apiError("QR code not found", "QR_NOT_FOUND", 404);
    }

    const pngBuffer = await QRCode.toBuffer(uploadQr.url, {
      type: "png",
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    return new Response(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return handleServiceError(error);
  }
}
