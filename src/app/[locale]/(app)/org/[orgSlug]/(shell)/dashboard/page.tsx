import { Suspense } from "react";
import { CalendarDays, CheckCircle2, Plus, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { DashboardEmptyEvents } from "@/components/dashboard/dashboard-empty-events";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { DashboardFiltersSkeleton } from "@/components/dashboard/org-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div
      className={cn(
        "dashboard-stat-enter dashboard-surface flex items-center gap-4 p-4",
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
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
    { label: t("activeEvents"), value: activeResult.total, icon: Sparkles, delayMs: 60 },
    { label: t("upcomingEvents"), value: upcomingResult.total, icon: CalendarDays, delayMs: 120 },
    {
      label: t("completedEvents"),
      value: completedResult.total,
      icon: CheckCircle2,
      delayMs: 180,
    },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t("title")}
          </h1>
          <p className="text-sm text-foreground/90">{t("welcomeWarm", { firstName })}</p>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="gold" asChild className="h-9 shrink-0">
          <Link href={orgPath(orgSlug, "/events/new")}>
            <Plus className="h-4 w-4" />
            {t("createEvent")}
          </Link>
        </Button>
      </header>

      <Suspense fallback={<DashboardFiltersSkeleton />}>
        <DashboardFilters
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          currentClientId={clientId}
          currentTimeframe={timeframe}
        />
      </Suspense>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="dashboard-section">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{t("recentEvents")}</h2>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
            <Link href={orgPath(orgSlug, "/events")}>{tCommon("viewAll")}</Link>
          </Button>
        </div>

        {events.length === 0 ? (
          <DashboardEmptyEvents
            title={t("noEvents")}
            description={t("noEventsDesc")}
            actionLabel={t("createEvent")}
            actionHref={orgPath(orgSlug, "/events/new")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={orgPath(orgSlug, `/events/${event.id}/overview`)}
                className="group"
              >
                <article className="dashboard-surface h-full p-5 transition-colors hover:border-white/20 hover:bg-black/50">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold group-hover:text-primary">{event.name}</h3>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary hover:bg-primary/10"
                    >
                      {tEvents(`statuses.${event.status.toLowerCase()}` as "statuses.draft")}
                    </Badge>
                  </div>
                  {event.client ? (
                    <p className="mt-1 text-xs text-muted-foreground">{event.client.name}</p>
                  ) : null}
                  <p className="mt-3 text-sm text-muted-foreground">
                    {formatDate(event.date, locale as "el" | "en")}
                  </p>
                  {event.location ? (
                    <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>
                  ) : null}
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
