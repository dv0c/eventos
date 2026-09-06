import { notFound } from "next/navigation";

import { EventOverview } from "@/components/events/event-overview";
import { getEventAdminContext } from "@/server/events/event-admin";
import { requireAuth } from "@/server/auth/session";
import { eventService } from "@/server/services/event.service";
import { mediaService } from "@/server/services/media.service";

interface OverviewPageProps {
  params: Promise<{ locale: string; orgSlug: string; eventId: string }>;
}

export default async function EventOverviewPage({ params }: OverviewPageProps) {
  const { locale, orgSlug, eventId } = await params;
  const session = await requireAuth();

  try {
    const { event, stats } = await eventService.getEventOverview(
      session.user.id,
      eventId,
    );
    const { canEdit } = await getEventAdminContext(eventId);
    const albumToken = await mediaService.getUploadTokenForEvent(eventId);
    const albumHref = `/${locale}/a/${albumToken}`;

    return (
      <EventOverview
        eventId={eventId}
        eventSlug={event.slug}
        eventName={event.name}
        orgSlug={orgSlug}
        albumHref={albumHref}
        enableGallery={event.settings?.enableGallery ?? false}
        enableWall={event.settings?.enableWall ?? false}
        canEdit={canEdit}
        stats={{
          totalMedia: stats.totalMedia,
          pendingMedia: stats.pendingMedia,
          mediaToday: stats.mediaToday,
          guestCount: stats.guestCount,
        }}
      />
    );
  } catch {
    notFound();
  }
}
