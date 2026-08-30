import { notFound } from "next/navigation";

import { EventOverview } from "@/components/events/event-overview";
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

    return <EventOverview stats={stats} eventName={event.name} />;
  } catch {
    notFound();
  }
}
