import { EventStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { DashboardEmptyEvents } from "@/components/dashboard/dashboard-empty-events";
import { EventLifecycleBadge } from "@/components/organization/event-lifecycle-badge";
import { OrgPageHeader } from "@/components/organization/org-page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { orgPath } from "@/lib/org-path";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { getEventLifecycle } from "@/server/events/event-ended";
import { eventService } from "@/server/services/event.service";

function EventRow({
  event,
  orgSlug,
  locale,
  openLabel,
}: {
  event: {
    id: string;
    name: string;
    date: Date;
    location?: string | null;
    client?: { name: string } | null;
    status: EventStatus;
    startTime?: string | null;
    endTime?: string | null;
    endDate?: Date | null;
  };
  orgSlug: string;
  locale: string;
  openLabel: string;
}) {
  const lifecycle = getEventLifecycle(event);
  const overviewHref = orgPath(orgSlug, `/events/${event.id}/overview`);

  return (
    <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <Link
          href={overviewHref}
          className="font-medium text-foreground hover:text-primary"
        >
          {event.name}
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDate(event.date, locale as "el" | "en")}
          {event.client ? ` · ${event.client.name}` : ""}
        </p>
      </div>
      <EventLifecycleBadge lifecycle={lifecycle} />
      <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2.5" asChild>
        <Link href={overviewHref}>{openLabel}</Link>
      </Button>
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  const t = await getTranslations("dashboard");
  const tEvents = await getTranslations("events");
  const tCommon = await getTranslations("common");
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;

  const { events } = await eventService.listEvents(session.user.id, {
    organizationId,
    pageSize: 50,
  });

  const createHref = orgPath(orgSlug, "/events/new");

  if (events.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <OrgPageHeader
          title={t("overview")}
          description={t("subtitle")}
          actionLabel={t("createEvent")}
          actionHref={createHref}
        />
        <DashboardEmptyEvents
          title={t("noEvents")}
          description={t("noEventsDesc")}
          actionLabel={t("createEvent")}
          actionHref={createHref}
        />
      </div>
    );
  }

  const attention = events.filter((e) => e.status === EventStatus.DRAFT).slice(0, 8);
  const upcomingLive = events
    .filter((e) => {
      if (e.status === EventStatus.DRAFT) return false;
      const life = getEventLifecycle(e);
      return life === "waiting" || life === "active";
    })
    .slice(0, 8);
  const attentionIds = new Set(attention.map((e) => e.id));
  const upcomingIds = new Set(upcomingLive.map((e) => e.id));
  const recent = events
    .filter((e) => !attentionIds.has(e.id) && !upcomingIds.has(e.id))
    .slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <OrgPageHeader
        title={t("overview")}
        description={t("subtitle")}
        actionLabel={t("createEvent")}
        actionHref={createHref}
      />

      {attention.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {t("needsAttention")}
          </h2>
          <div className="overflow-hidden rounded-lg border border-white/10">
            {attention.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                orgSlug={orgSlug}
                locale={locale}
                openLabel={tEvents("open")}
              />
            ))}
          </div>
        </section>
      ) : null}

      {upcomingLive.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {t("upcomingLive")}
            </h2>
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" asChild>
              <Link href={orgPath(orgSlug, "/events")}>{tCommon("viewAll")}</Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10">
            {upcomingLive.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                orgSlug={orgSlug}
                locale={locale}
                openLabel={tEvents("open")}
              />
            ))}
          </div>
        </section>
      ) : null}

      {recent.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {t("recentEvents")}
            </h2>
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" asChild>
              <Link href={orgPath(orgSlug, "/events")}>{tCommon("viewAll")}</Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10">
            {recent.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                orgSlug={orgSlug}
                locale={locale}
                openLabel={tEvents("open")}
              />
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-sm text-muted-foreground">
        <Link
          href={orgPath(orgSlug, "/analytics")}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("analyticsLink")}
        </Link>
      </p>
    </div>
  );
}
