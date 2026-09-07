import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { DashboardEmptyEvents } from "@/components/dashboard/dashboard-empty-events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
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

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="gold" asChild className="h-9 shrink-0">
          <Link href={orgPath(orgSlug, "/events/new")}>
            <Plus className="h-4 w-4" />
            {t("create")}
          </Link>
        </Button>
      </header>

      {events.length === 0 ? (
        <DashboardEmptyEvents
          title={t("noEvents")}
          description={t("noEventsDesc")}
          actionLabel={t("create")}
          actionHref={orgPath(orgSlug, "/events/new")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const lifecycle = getEventLifecycle(event);
            return (
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
                      {t(`types.${event.type.toLowerCase()}` as "types.wedding")}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {formatDate(event.date, locale as "el" | "en")}
                  </p>
                  {event.location ? (
                    <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>
                  ) : null}
                  <div className="mt-3">
                    <Badge variant="outline" className="border-primary/20 text-muted-foreground">
                      {t(`lifecycle.${lifecycle}`)}
                    </Badge>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
