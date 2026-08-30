import { notFound } from "next/navigation";

import { RsvpDashboard } from "@/components/events/rsvp-dashboard";
import {
  getActiveOrganizationId,
  requireAuth,
} from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";
import { guestRepository } from "@/server/repositories/guest.repository";

interface RsvpPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventRsvpPage({ params }: RsvpPageProps) {
  const { eventId } = await params;
  await requireAuth();
  const organizationId = await getActiveOrganizationId();

  if (!organizationId) {
    notFound();
  }

  const event = await eventRepository.findById(organizationId, eventId);
  if (!event) {
    notFound();
  }

  const stats = await guestRepository.countByStatus(eventId);
  const totalGuests = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <RsvpDashboard
      eventId={eventId}
      stats={stats}
      totalGuests={totalGuests}
      hasResend={!!process.env.RESEND_API_KEY}
    />
  );
}
