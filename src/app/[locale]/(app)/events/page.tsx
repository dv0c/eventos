import { CalendarDays, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import {
  getActiveOrganizationId,
  requireAuth,
} from "@/server/auth/session";
import { eventService } from "@/server/services/event.service";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("events");
  const session = await requireAuth();
  const organizationId = await getActiveOrganizationId();

  if (!organizationId) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={t("noEvents")}
        description={t("noEventsDesc")}
        action={{ label: t("create"), href: "/events/new" }}
      />
    );
  }

  const { events } = await eventService.listEvents(session.user.id, {
    organizationId,
    pageSize: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="gold" asChild>
          <Link href="/events/new">
            <Plus className="h-4 w-4" />
            {t("create")}
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("noEvents")}
          description={t("noEventsDesc")}
          action={{ label: t("create"), href: "/events/new" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}/overview`}>
              <Card className="surface-elevated transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{event.name}</h3>
                    <Badge variant="outline">
                      {t(`types.${event.type.toLowerCase()}` as "types.wedding")}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {formatDate(event.date, locale as "el" | "en")}
                  </p>
                  {event.location ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.location}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <Badge variant="secondary">
                      {t(`statuses.${event.status.toLowerCase()}` as "statuses.draft")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
