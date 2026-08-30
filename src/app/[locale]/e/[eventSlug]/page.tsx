import { Calendar, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { EventCountdown } from "@/components/events/event-countdown";
import { formatDate } from "@/lib/format";
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

  const primaryColor = event.theme?.primaryColor ?? "#8B5CF6";
  const secondaryColor = event.theme?.secondaryColor ?? "#F59E0B";

  return (
    <div className="min-h-screen">
      <section
        className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-white/80">
            {t("youAreInvited")}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {event.name}
          </h1>
          {event.description ? (
            <p className="mt-6 text-lg text-white/90">{event.description}</p>
          ) : null}

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
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

          <div className="mt-12">
            <EventCountdown targetDate={event.date.toISOString()} />
          </div>

          {event.settings?.allowRsvp ? (
            <p className="mt-10 text-sm text-white/80">
              {t("rsvpHint")}
            </p>
          ) : null}
        </div>
      </section>

      {event.address ? (
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-xl font-semibold">{t("location")}</h2>
          <p className="mt-2 text-muted-foreground">{event.address}</p>
        </section>
      ) : null}
    </div>
  );
}
