import { notFound } from "next/navigation";

import { TimelineEditor } from "@/components/timeline/timeline-editor";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";
import { timelineService } from "@/server/services/timeline.service";

interface TimelinePageProps {
  params: Promise<{ orgSlug: string; eventId: string }>;
}

export default async function EventTimelinePage({ params }: TimelinePageProps) {
  const { eventId, orgSlug } = await params;
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;

  const event = await eventRepository.findById(organizationId, eventId);
  if (!event) {
    notFound();
  }

  const { items } = await timelineService.listItems(session.user.id, eventId);

  return <TimelineEditor eventId={eventId} initialItems={items} />;
}
