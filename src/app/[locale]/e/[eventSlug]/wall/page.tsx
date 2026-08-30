import { notFound } from "next/navigation";

import { LiveWall } from "@/components/media/live-wall";
import { eventRepository } from "@/server/repositories/event.repository";

interface PublicEventWallPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function PublicEventWallPage({ params }: PublicEventWallPageProps) {
  const { eventSlug } = await params;

  const event = await eventRepository.findBySlugPublic(eventSlug);

  if (!event) {
    notFound();
  }

  if (!event.settings?.enableWall) {
    notFound();
  }

  return (
    <LiveWall
      eventSlug={eventSlug}
      primaryColor={event.theme?.primaryColor}
      secondaryColor={event.theme?.secondaryColor}
    />
  );
}
