import { notFound } from "next/navigation";

import { RsvpDashboard } from "@/components/events/rsvp-dashboard";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";
import { guestRepository } from "@/server/repositories/guest.repository";

interface RsvpPageProps {
  params: Promise<{ orgSlug: string; eventId: string }>;
}

export default async function EventRsvpPage({ params }: RsvpPageProps) {
  const { eventId, orgSlug } = await params;
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;

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
