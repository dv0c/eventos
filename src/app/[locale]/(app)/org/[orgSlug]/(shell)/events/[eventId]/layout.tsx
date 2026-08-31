import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { EventNav } from "@/components/events/event-nav";
import { Badge } from "@/components/ui/badge";
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
  const { eventId, orgSlug } = await params;
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;
  const t = await getTranslations("events");
  const event = await eventRepository.findById(organizationId, eventId);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{event.name}</h2>
            <Badge variant="secondary">
              {t(`statuses.${event.status.toLowerCase()}` as "statuses.draft")}
            </Badge>
          </div>
        </div>
      </div>
      <EventNav eventId={eventId} eventSlug={event.slug} />
      {children}
    </div>
  );
}
