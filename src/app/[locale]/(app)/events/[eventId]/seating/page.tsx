import { notFound } from "next/navigation";

import { SeatingPlanner } from "@/components/seating/seating-planner";
import {
  getActiveOrganizationId,
  requireAuth,
} from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";
import { seatingService } from "@/server/services/seating.service";

interface SeatingPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventSeatingPage({ params }: SeatingPageProps) {
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

  const seating = await seatingService.getSeating(session.user.id, eventId);

  return (
    <SeatingPlanner
      eventId={eventId}
      initialTables={seating.tables}
      initialUnassignedGuests={seating.unassignedGuests}
      initialStats={seating.stats}
    />
  );
}
