import { notFound } from "next/navigation";

import { LiveWall } from "@/components/media/live-wall";
import { prisma } from "@/server/db";
import { getEventAdminContext } from "@/server/events/event-admin";
import { eventRepository } from "@/server/repositories/event.repository";

interface PublicEventWallPageProps {
  params: Promise<{ locale: string; eventSlug: string }>;
}

export default async function PublicEventWallPage({ params }: PublicEventWallPageProps) {
  const { locale, eventSlug } = await params;

  const event = await eventRepository.findBySlugPublic(eventSlug);

  if (!event) {
    notFound();
  }

  if (!event.settings?.enableWall) {
    notFound();
  }

  const { canEdit } = await getEventAdminContext(event.id);
  const callbackUrl = `/${locale}/e/${eventSlug}/wall`;

  let settingsHref: string | undefined;
  if (canEdit) {
    const org = await prisma.organization.findUnique({
      where: { id: event.organizationId },
      select: { slug: true },
    });
    if (org) {
      settingsHref = `/org/${org.slug}/events/${event.id}/settings`;
    }
  }

  return (
    <LiveWall
      eventSlug={eventSlug}
      eventId={event.id}
      canEdit={canEdit}
      callbackUrl={callbackUrl}
      primaryColor={event.theme?.primaryColor}
      secondaryColor={event.theme?.secondaryColor}
      settingsHref={settingsHref}
    />
  );
}
