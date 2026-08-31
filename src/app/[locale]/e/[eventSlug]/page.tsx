import { Calendar, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { EventMediaHubCards } from "@/components/events/event-media-hub-cards";
import { EventCountdown } from "@/components/events/event-countdown";
import { formatDate } from "@/lib/format";
import { getEventAdminContext } from "@/server/events/event-admin";
import { eventRepository } from "@/server/repositories/event.repository";

interface PublicEventPageProps {
  params: Promise<{ locale: string; eventSlug: string }>;
}

export default async function PublicEventPage({ params }: PublicEventPageProps) {
  const { locale, eventSlug } = await params;
  const t = await getTranslations("publicEvent");

  const event = await eventRepository.findBySlugPublic(eventSlug);

  if (!event) {
    notFound();
  }

  const { canEdit } = await getEventAdminContext(event.id);
  const callbackUrl = `/${locale}/e/${eventSlug}`;

  const primaryColor = event.theme?.primaryColor ?? "#8B5CF6";
  const secondaryColor = event.theme?.secondaryColor ?? "#F59E0B";

  return (
    <div className="min-h-screen bg-background">
      <section
        className="relative px-4 py-12 text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{event.name}</h1>
          {event.description ? (
            <p className="mt-4 text-base text-white/90">{event.description}</p>
          ) : null}

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-8">
            <div className="flex items-center gap-2 text-white/90">
              <Calendar className="h-5 w-5" />
              <span>{formatDate(event.date, locale as "el" | "en")}</span>
            </div>
            {event.location ? (
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="h-5 w-5" />
                <span>{event.location}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-8">
            <EventCountdown targetDate={event.date.toISOString()} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <EventMediaHubCards
          eventId={canEdit ? event.id : undefined}
          eventSlug={eventSlug}
          enableGallery={event.settings?.enableGallery ?? false}
          enableWall={event.settings?.enableWall ?? false}
          canEdit={canEdit}
          callbackUrl={callbackUrl}
          variant="public"
        />
      </section>

      {event.address ? (
        <section className="mx-auto max-w-3xl px-4 pb-16 text-center">
          <h2 className="text-xl font-semibold">{t("location")}</h2>
          <p className="mt-2 text-muted-foreground">{event.address}</p>
        </section>
      ) : null}
    </div>
  );
}
