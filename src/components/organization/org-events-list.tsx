"use client";

import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { EventLifecycleBadge } from "@/components/organization/event-lifecycle-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { orgPath } from "@/lib/org-path";
import type { EventLifecycle } from "@/server/events/event-ended";
import { cn } from "@/lib/utils";

export type OrgEventListItem = {
  id: string;
  name: string;
  date: Date;
  updatedAt?: Date;
  location?: string | null;
  clientName?: string | null;
  lifecycle: EventLifecycle;
};

export function OrgEventsList({
  events,
  orgSlug,
  locale,
}: {
  events: OrgEventListItem[];
  orgSlug: string;
  locale: string;
}) {
  const t = useTranslations("events");
  const loc = locale as "el" | "en";

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-white/10 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[12px] text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("name")}</th>
              <th className="px-4 py-3 font-medium">{t("date")}</th>
              <th className="px-4 py-3 font-medium">{t("status")}</th>
              <th className="px-4 py-3 font-medium">{t("updated")}</th>
              <th className="px-4 py-3 text-right font-medium">
                <span className="sr-only">{t("actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const overviewHref = orgPath(orgSlug, `/events/${event.id}/overview`);
              const settingsHref = orgPath(orgSlug, `/events/${event.id}/settings`);
              return (
                <tr
                  key={event.id}
                  className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={overviewHref}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {event.name}
                    </Link>
                    {event.clientName ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {event.clientName}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(event.date, loc)}
                  </td>
                  <td className="px-4 py-3">
                    <EventLifecycleBadge lifecycle={event.lifecycle} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.updatedAt ? formatDate(event.updatedAt, loc) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 px-2.5" asChild>
                        <Link href={overviewHref}>{t("open")}</Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={t("moreActions")}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={overviewHref}>{t("open")}</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={settingsHref}>{t("eventSettings")}</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked rows */}
      <div className="space-y-2 md:hidden">
        {events.map((event) => {
          const overviewHref = orgPath(orgSlug, `/events/${event.id}/overview`);
          return (
            <div
              key={event.id}
              className={cn(
                "rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={overviewHref}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {event.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(event.date, loc)}
                  </p>
                </div>
                <EventLifecycleBadge lifecycle={event.lifecycle} />
              </div>
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" className="h-8 px-2.5" asChild>
                  <Link href={overviewHref}>{t("open")}</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
