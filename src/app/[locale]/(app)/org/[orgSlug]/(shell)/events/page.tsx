import { getTranslations } from "next-intl/server";

import { DashboardEmptyEvents } from "@/components/dashboard/dashboard-empty-events";
import { OrgEventsList } from "@/components/organization/org-events-list";
import { OrgPageHeader } from "@/components/organization/org-page-header";
import { orgPath } from "@/lib/org-path";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { getEventLifecycle } from "@/server/events/event-ended";
import { eventService } from "@/server/services/event.service";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  const t = await getTranslations("events");
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;

  const { events } = await eventService.listEvents(session.user.id, {
    organizationId,
    pageSize: 50,
  });

  const createHref = orgPath(orgSlug, "/events/new");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <OrgPageHeader
        title={t("title")}
        description={t("subtitle")}
        actionLabel={t("create")}
        actionHref={createHref}
      />

      {events.length === 0 ? (
        <DashboardEmptyEvents
          title={t("noEvents")}
          description={t("noEventsDesc")}
          actionLabel={t("create")}
          actionHref={createHref}
        />
      ) : (
        <OrgEventsList
          orgSlug={orgSlug}
          locale={locale}
          events={events.map((event) => ({
            id: event.id,
            name: event.name,
            date: event.date,
            updatedAt: event.updatedAt,
            location: event.location,
            clientName: event.client?.name ?? null,
            lifecycle: getEventLifecycle(event),
          }))}
        />
      )}
    </div>
  );
}
