"use client";

import { Download, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { EventHomeActivity } from "@/components/events/event-home-activity";
import { EventHomeFeatures } from "@/components/events/event-home-features";
import { EventHomeShare } from "@/components/events/event-home-share";
import { EventLifecycleBadge } from "@/components/organization/event-lifecycle-badge";
import { Button } from "@/components/ui/button";
import type { EventLifecycle } from "@/server/events/event-ended";

interface EventOverviewStatsProps {
  totalMedia: number;
  pendingMedia: number;
  mediaToday: number;
  guestCount: number;
}

interface EventOverviewProps {
  eventId: string;
  eventSlug: string;
  eventName: string;
  orgSlug: string;
  albumHref: string | null;
  enableGallery: boolean;
  enableWall: boolean;
  canEdit: boolean;
  lifecycle: EventLifecycle;
  mediaPurgeAt?: string | null;
  stats: EventOverviewStatsProps;
}

export function EventOverview({
  eventId,
  eventSlug,
  eventName,
  orgSlug,
  albumHref,
  enableGallery,
  enableWall,
  canEdit,
  lifecycle,
  mediaPurgeAt = null,
  stats,
}: EventOverviewProps) {
  const tHome = useTranslations("eventWorkspace.home");
  const tMedia = useTranslations("eventWorkspace.media");
  const waiting = lifecycle === "waiting";
  const ended = lifecycle === "ended";

  const retentionLabel = useMemo(() => {
    if (!ended || !mediaPurgeAt) return null;
    const purgeMs = new Date(mediaPurgeAt).getTime();
    if (!Number.isFinite(purgeMs)) return null;
    const daysLeft = Math.max(
      0,
      Math.ceil((purgeMs - Date.now()) / (24 * 60 * 60 * 1000)),
    );
    return tMedia("retentionCountdown", { days: daysLeft });
  }, [ended, mediaPurgeAt, tMedia]);

  const statusText = ended
    ? tHome("statusEnded")
    : waiting
      ? tHome("statusWaiting")
      : stats.pendingMedia > 0
        ? tHome("statusPending", { count: stats.pendingMedia })
        : !enableGallery && !enableWall
          ? tHome("statusInactive")
          : tHome("statusReady");

  function scrollToShare() {
    document.getElementById("share-with-guests")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const wallDisabled = !enableWall || ended || waiting;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {eventName}
            </h1>
            <EventLifecycleBadge lifecycle={lifecycle} />
          </div>
          <p className="text-sm text-muted-foreground">{statusText}</p>
          {retentionLabel ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">{retentionLabel}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {ended ? (
            <Button
              type="button"
              size="sm"
              className="h-9"
              onClick={() => {
                window.location.href = `/api/events/${eventId}/media/download`;
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {tMedia("downloadZip")}
            </Button>
          ) : null}
          <Button type="button" size="sm" className="h-9" onClick={scrollToShare}>
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            {tHome("shareEvent")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-background"
            asChild
            disabled={!albumHref}
          >
            <a href={albumHref ?? "#"} target="_blank" rel="noopener noreferrer">
              {tHome("openAlbum")}
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-background"
            asChild
            disabled={wallDisabled}
          >
            <a href={`/e/${eventSlug}/wall`} target="_blank" rel="noopener noreferrer">
              {tHome("openWall")}
            </a>
          </Button>
        </div>
      </header>

      <EventHomeShare
        eventId={eventId}
        eventSlug={eventSlug}
        enableGallery={enableGallery}
        lifecycle={lifecycle}
      />

      <EventHomeActivity
        totalMedia={stats.totalMedia}
        guestCount={stats.guestCount}
        mediaToday={stats.mediaToday}
        pendingMedia={stats.pendingMedia}
      />

      <EventHomeFeatures
        eventId={eventId}
        eventSlug={eventSlug}
        orgSlug={orgSlug}
        albumHref={albumHref}
        enableGallery={enableGallery && !waiting}
        enableWall={enableWall && !ended && !waiting}
        canEdit={canEdit}
      />
    </div>
  );
}
