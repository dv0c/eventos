import { QRCodeType } from "@prisma/client";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { prisma } from "@/server/db";
import { getWallSettingsFromSections } from "@/server/events/wall-settings";
import { eventRepository } from "@/server/repositories/event.repository";
import { getStorageProvider } from "@/server/providers/storage";

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

    const wall = getWallSettingsFromSections(event.settings.sections);

    const uploadQr = await prisma.qRCode.findFirst({
      where: { eventId: event.id, type: QRCodeType.UPLOAD },
    });

    const storage = getStorageProvider();
    const uploadQrImageUrl = uploadQr?.storageKey
      ? storage.getPublicUrl(uploadQr.storageKey)
      : null;

    return apiSuccess({
      wall,
      theme: {
        primaryColor: event.theme?.primaryColor ?? "#8B5CF6",
        secondaryColor: event.theme?.secondaryColor ?? "#F59E0B",
      },
      uploadUrl: uploadQr?.url ?? null,
      uploadQrImageUrl,
      eventName: event.name,
    });
  } catch (error) {
    return handleServiceError(error);
  }
}
