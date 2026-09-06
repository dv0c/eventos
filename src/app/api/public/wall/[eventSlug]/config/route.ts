import { QRCodeType } from "@prisma/client";

import { apiError, apiSuccess, handleServiceError } from "@/lib/api-response";
import { prisma } from "@/server/db";
import {
  getAppearanceFromSections,
  getModerationFromSections,
  getWallSettingsFromSections,
} from "@/server/events/wall-settings";
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

    const wall = getWallSettingsFromSections(event.settings.sections);
    const appearance = getAppearanceFromSections(event.settings.sections);
    const moderation = getModerationFromSections(event.settings.sections);

    const uploadQr = await prisma.qRCode.findFirst({
      where: { eventId: event.id, type: QRCodeType.UPLOAD },
    });

    const uploadQrImageUrl = uploadQr
      ? `/api/public/wall/${eventSlug}/qr`
      : null;

    return apiSuccess({
      wall,
      theme: {
        primaryColor: event.theme?.primaryColor ?? "#8B5CF6",
        secondaryColor: event.theme?.secondaryColor ?? "#F59E0B",
        logoUrl: event.theme?.logoUrl ?? null,
      },
      appearance: {
        captionTheme: appearance.captionTheme,
        removeBranding: appearance.removeBranding,
        displayLanguage: appearance.displayLanguage,
        welcomeScreenEnabled: appearance.welcomeScreenEnabled,
        welcomeScreenTitle: appearance.welcomeScreenTitle,
        welcomeScreenMessage: appearance.welcomeScreenMessage,
      },
      allowPhotos: moderation.allowPhotos,
      allowVideos: moderation.allowVideos,
      uploadUrl: uploadQr?.url ?? null,
      uploadQrImageUrl,
      eventName: event.name,
    });
  } catch (error) {
    return handleServiceError(error);
  }
}
