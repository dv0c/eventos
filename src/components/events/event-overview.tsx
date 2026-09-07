"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { EventHomeActivity } from "@/components/events/event-home-activity";
import { EventHomeFeatures } from "@/components/events/event-home-features";
import { EventHomeShare } from "@/components/events/event-home-share";
import { useOrg } from "@/components/providers/org-provider";
import { Badge } from "@/components/ui/badge";
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
  stats,
}: EventOverviewProps) {
  const t = useTranslations("eventWorkspace");
  const tHome = useTranslations("eventWorkspace.home");
  const { planName } = useOrg();
  const ended = lifecycle === "ended";

  const statusText = ended
    ? tHome("statusEnded")
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

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {eventName}
            </h1>
            <Badge
              variant="outline"
              className="rounded-md border-border/70 px-2 py-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {t("planBadge", { plan: planName })}
            </Badge>
            {ended ? (
              <Badge
                variant="outline"
                className="rounded-md border-destructive/40 px-2 py-0 text-[10px] font-medium uppercase tracking-wide text-destructive"
              >
                {tHome("lifecycleEnded")}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{statusText}</p>
        </div>

        <div className="hidden flex-wrap gap-2 sm:flex">
          {!ended ? (
            <Button type="button" size="sm" className="h-9" onClick={scrollToShare}>
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              {tHome("shareEvent")}
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-background"
            asChild
            disabled={!albumHref || ended}
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
            disabled={!enableWall || ended}
          >
            <a href={`/e/${eventSlug}/wall`} target="_blank" rel="noopener noreferrer">
              {tHome("openWall")}
            </a>
          </Button>
        </div>
      </header>

      {!ended ? (
        <div className="space-y-3 sm:hidden">
          <Button type="button" className="h-10 w-full" onClick={scrollToShare}>
            <Share2 className="mr-1.5 h-4 w-4" />
            {tHome("shareEvent")}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-10 bg-background" asChild disabled={!albumHref}>
              <a href={albumHref ?? "#"} target="_blank" rel="noopener noreferrer">
                {tHome("openAlbum")}
              </a>
            </Button>
            <Button
              variant="outline"
              className="h-10 bg-background"
              asChild
              disabled={!enableWall}
            >
              <a href={`/e/${eventSlug}/wall`} target="_blank" rel="noopener noreferrer">
                {tHome("openWall")}
              </a>
            </Button>
          </div>
        </div>
      ) : null}

      <EventHomeShare
        eventId={eventId}
        eventSlug={eventSlug}
        enableGallery={enableGallery}
        ended={ended}
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
        albumHref={ended ? null : albumHref}
        enableGallery={enableGallery && !ended}
        enableWall={enableWall && !ended}
        canEdit={canEdit}
      />
    </div>
  );
}
