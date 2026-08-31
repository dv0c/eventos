import { CalendarDays, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { EventNav } from "@/components/events/event-nav";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; orgSlug: string; eventId: string }>;
}

export default async function EventLayout({
  children,
  params,
}: EventLayoutProps) {
  const { eventId, orgSlug, locale } = await params;
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;
  const t = await getTranslations("events");
  const event = await eventRepository.findById(organizationId, eventId);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{event.name}</h1>
          <Badge variant="secondary">
            {t(`statuses.${event.status.toLowerCase()}` as "statuses.draft")}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0" />
            {formatDate(event.date, locale as "el" | "en")}
          </span>
          {event.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" />
              {event.location}
            </span>
          ) : null}
        </div>
      </div>
      <EventNav eventId={eventId} />
      {children}
    </div>
  );
}
