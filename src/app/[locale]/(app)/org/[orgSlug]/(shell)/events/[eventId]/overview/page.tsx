import { notFound } from "next/navigation";

import { EventOverview } from "@/components/events/event-overview";
import { requireAuth } from "@/server/auth/session";
import { getEventAdminContext } from "@/server/events/event-admin";
import { getEventLifecycle, getMediaPurgeAt } from "@/server/events/event-ended";
import { revokeGuestConnectIfEnded } from "@/server/events/revoke-guest-connect";
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
    await revokeGuestConnectIfEnded(eventId);
    const lifecycle = getEventLifecycle(event);
    const waiting = lifecycle === "waiting";
    const mediaPurgeAt =
      lifecycle === "ended" ? getMediaPurgeAt(event).toISOString() : null;
    const { canEdit } = await getEventAdminContext(eventId);
    const albumToken = waiting
      ? null
      : await mediaService.getUploadTokenForEvent(eventId);
    const albumHref = albumToken ? `/${locale}/a/${albumToken}` : null;

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
        lifecycle={lifecycle}
        mediaPurgeAt={mediaPurgeAt}
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
