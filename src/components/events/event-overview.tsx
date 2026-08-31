"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

import { EventMediaHubCards } from "@/components/events/event-media-hub-cards";
import { EventStatStrip } from "@/components/events/event-stat-strip";
import { GuidancePanel } from "@/components/events/guidance-panel";
import type { EventOverviewStats } from "@/server/repositories/event.repository";
import { formatNumber } from "@/lib/format";

interface EventOverviewProps {
  eventId: string;
  eventSlug: string;
  enableGallery: boolean;
  enableWall: boolean;
  canEdit: boolean;
  stats: EventOverviewStats;
}

export function EventOverview({
  eventId,
  eventSlug,
  enableGallery,
  enableWall,
  canEdit,
  stats,
}: EventOverviewProps) {
  const t = useTranslations("overview");
  const locale = useLocale() as "el" | "en";

  const statStrip = [
    { label: t("totalPhotos"), value: formatNumber(stats.totalMedia, locale) },
    { label: t("approvedPhotos"), value: formatNumber(stats.approvedMedia, locale) },
    { label: t("pendingPhotos"), value: formatNumber(stats.pendingMedia, locale) },
    {
      label: t("daysUntilEvent"),
      value: stats.daysUntilEvent > 0 ? stats.daysUntilEvent : t("todayOrPast"),
    },
  ];

  return (
    <div className="space-y-6">
      <EventStatStrip stats={statStrip} />

      <EventMediaHubCards
        eventId={eventId}
        eventSlug={eventSlug}
        enableGallery={enableGallery}
        enableWall={enableWall}
        canEdit={canEdit}
        variant="host"
      />

      <GuidancePanel
        eventId={eventId}
        eventSlug={eventSlug}
        daysUntilEvent={stats.daysUntilEvent}
        enableGallery={enableGallery}
        enableWall={enableWall}
        totalMedia={stats.totalMedia}
        approvedMedia={stats.approvedMedia}
        totalTasks={stats.totalTasks}
        completedTasks={stats.completedTasks}
      />
    </div>
  );
}
