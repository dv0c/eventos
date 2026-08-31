import { Suspense } from "react";
import { CalendarDays, CheckCircle2, Plus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { DashboardEmptyEvents } from "@/components/dashboard/dashboard-empty-events";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { DashboardHostIllustration } from "@/components/dashboard/dashboard-host-illustration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { orgPath } from "@/lib/org-path";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EventTimeframe } from "@/server/repositories/event.repository";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { clientService } from "@/server/services/client.service";
import { eventService } from "@/server/services/event.service";

function getFirstName(name?: string | null, email?: string | null): string {
  const fromName = name?.trim().split(/\s+/)[0];
  if (fromName) {
    return fromName;
  }

  const fromEmail = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim().split(/\s+/)[0];
  return fromEmail || "there";
}

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  delayMs: number;
}

function StatCard({ label, value, icon: Icon, delayMs }: StatCardProps) {
  return (
    <Card
      className={cn(
        "dashboard-stat-enter rounded-2xl border-border/50 bg-card shadow-none",
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
          <Icon className="h-5 w-5 text-primary/80" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

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
  const firstName = getFirstName(session.user.name, session.user.email);

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

  const stats = [
    { label: t("totalEvents"), value: total, icon: CalendarDays, delayMs: 0 },
    { label: t("activeEvents"), value: activeResult.total, icon: CalendarDays, delayMs: 60 },
    { label: t("upcomingEvents"), value: upcomingResult.total, icon: Users, delayMs: 120 },
    {
      label: t("completedEvents"),
      value: completedResult.total,
      icon: CheckCircle2,
      delayMs: 180,
    },
  ] as const;

  return (
    <div className="relative space-y-8 lg:pr-[min(24vw,360px)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-base text-foreground/90">
            {t("welcomeWarm", { firstName })}
          </p>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="gold" asChild className="shrink-0">
          <Link href={orgPath(orgSlug, "/events/new")}>
            <Plus className="h-4 w-4" />
            {t("createEvent")}
          </Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <DashboardFilters
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          currentClientId={clientId}
          currentTimeframe={timeframe}
        />
      </Suspense>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{t("recentEvents")}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={orgPath(orgSlug, "/events")}>{tCommon("viewAll")}</Link>
          </Button>
        </div>

        {events.length === 0 ? (
          <DashboardEmptyEvents
            title={t("noEvents")}
            description={t("noEventsDesc")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} href={orgPath(orgSlug, `/events/${event.id}/overview`)}>
                <Card className="rounded-2xl border-border/50 bg-card shadow-none transition-shadow hover:shadow-md">
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

      <DashboardHostIllustration />
    </div>
  );
}
