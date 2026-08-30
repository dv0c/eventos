import { notFound } from "next/navigation";

import { TimelineEditor } from "@/components/timeline/timeline-editor";
import {
  getActiveOrganizationId,
  requireAuth,
} from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";
import { timelineService } from "@/server/services/timeline.service";

interface TimelinePageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventTimelinePage({ params }: TimelinePageProps) {
  const { eventId } = await params;
  const session = await requireAuth();
  const organizationId = await getActiveOrganizationId();

  if (!organizationId) {
    notFound();
  }

  const event = await eventRepository.findById(organizationId, eventId);
  if (!event) {
    notFound();
  }

  const { items } = await timelineService.listItems(session.user.id, eventId);

  return <TimelineEditor eventId={eventId} initialItems={items} />;
}
