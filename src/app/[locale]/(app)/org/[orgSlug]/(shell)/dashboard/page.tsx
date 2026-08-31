import { Suspense } from "react";
import { CalendarDays, Plus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { orgPath } from "@/lib/org-path";
import { formatDate } from "@/lib/format";
import type { EventTimeframe } from "@/server/repositories/event.repository";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { clientService } from "@/server/services/client.service";
import { eventService } from "@/server/services/event.service";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<{ clientId?: string; timeframe?: string }>;
}) {
  const { locale, orgSlug } = await params;
  const { clientId, timeframe } = await searchParams;
  const t = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");
  const tEvents = await getTranslations("events");
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;

  const [{ clients }, activeResult, upcomingResult, completedResult, allResult] =
    await Promise.all([
      clientService.listClients(session.user.id, organizationId, { pageSize: 100 }),
      eventService.listEvents(session.user.id, {
        organizationId,
        clientId,
        timeframe: "active",
        pageSize: 5,
      }),
      eventService.listEvents(session.user.id, {
        organizationId,
        clientId,
        timeframe: "upcoming",
        pageSize: 5,
      }),
      eventService.listEvents(session.user.id, {
        organizationId,
        clientId,
        timeframe: "completed",
        pageSize: 5,
      }),
      eventService.listEvents(session.user.id, {
        organizationId,
        clientId,
        timeframe:
          timeframe && timeframe !== "all"
            ? (timeframe as EventTimeframe)
            : undefined,
        pageSize: 5,
      }),
    ]);

  const events = allResult.events;
  const total = allResult.total;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("welcome", { name: session.user.name ?? session.user.email ?? "" })}
        </p>
      </div>

      <Suspense fallback={null}>
        <DashboardFilters
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          currentClientId={clientId}
          currentTimeframe={timeframe}
        />
      </Suspense>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="surface-elevated">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("totalEvents")}</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CalendarDays className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("activeEvents")}</p>
              <p className="text-2xl font-bold">{activeResult.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
              <Users className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("upcomingEvents")}</p>
              <p className="text-2xl font-bold">{upcomingResult.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="flex items-center gap-4 p-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("completedEvents")}</p>
              <p className="text-2xl font-bold">{completedResult.total}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-elevated flex items-center justify-center p-4">
        <Button variant="gold" asChild>
          <Link href={orgPath(orgSlug, "/events/new")}>
            <Plus className="h-4 w-4" />
            {t("createEvent")}
          </Link>
        </Button>
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("recentEvents")}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={orgPath(orgSlug, "/events")}>{tCommon("viewAll")}</Link>
          </Button>
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={t("noEvents")}
            description={t("noEventsDesc")}
            action={{ label: t("createEvent"), href: orgPath(orgSlug, "/events/new") }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} href={orgPath(orgSlug, `/events/${event.id}/overview`)}>
                <Card className="surface-elevated transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{event.name}</h3>
                      <Badge variant="secondary">
                        {tEvents(`statuses.${event.status.toLowerCase()}` as "statuses.draft")}
                      </Badge>
                    </div>
                    {event.client ? (
                      <p className="mt-1 text-xs text-muted-foreground">{event.client.name}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatDate(event.date, locale as "el" | "en")}
                    </p>
                    {event.location ? (
                      <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
