import { notFound } from "next/navigation";

import { EventOverview } from "@/components/events/event-overview";
import { getEventAdminContext } from "@/server/events/event-admin";
import { requireAuth } from "@/server/auth/session";
import { eventService } from "@/server/services/event.service";

interface OverviewPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventOverviewPage({ params }: OverviewPageProps) {
  const { eventId } = await params;
  const session = await requireAuth();

  try {
    const { event, stats } = await eventService.getEventOverview(
      session.user.id,
      eventId,
    );
    const { canEdit } = await getEventAdminContext(eventId);

    return (
      <EventOverview
        eventId={eventId}
        eventSlug={event.slug}
        enableGallery={event.settings?.enableGallery ?? false}
        enableWall={event.settings?.enableWall ?? false}
        canEdit={canEdit}
        stats={stats}
      />
    );
  } catch {
    notFound();
  }
}
