import { notFound } from "next/navigation";

import { EventMediaManager } from "@/components/media/event-media-manager";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { getEventLifecycle } from "@/server/events/event-ended";
import { revokeGuestConnectIfEnded } from "@/server/events/revoke-guest-connect";
import { eventRepository } from "@/server/repositories/event.repository";
import { mediaService } from "@/server/services/media.service";

interface MediaPageProps {
  params: Promise<{ locale: string; orgSlug: string; eventId: string }>;
}

export default async function EventMediaPage({ params }: MediaPageProps) {
  const { locale, orgSlug, eventId } = await params;
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;
  const event = await eventRepository.findById(organizationId, eventId);

  if (!event) {
    notFound();
  }

  await revokeGuestConnectIfEnded(event.id);
  const lifecycle = getEventLifecycle(event);
  const waiting = lifecycle === "waiting";
  const albumToken = waiting
    ? null
    : await mediaService.getUploadTokenForEvent(event.id);
  const albumHref = albumToken ? `/${locale}/a/${albumToken}` : null;

  return (
    <EventMediaManager
      eventId={event.id}
      eventSlug={event.slug}
      albumHref={albumHref}
      lifecycle={lifecycle}
    />
  );
}
