"use client";

import {
  Download,
  Images,
  Link2,
  MonitorPlay,
  Pause,
  Play,
  QrCode,
  Settings2,
  Sparkles,
  Square,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EventHomeActivity } from "@/components/events/event-home-activity";
import { EventHomeFeatures } from "@/components/events/event-home-features";
import { EventHomeShare } from "@/components/events/event-home-share";
import { EventRunBadge } from "@/components/events/event-run-badge";
import { EventTierBadge } from "@/components/events/event-tier-badge";
import { useEventPremiumUpgrade } from "@/components/events/settings/settings-ui";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { EventLifecycle, EventRunPhase } from "@/server/events/event-ended";
import type { EventRunSnapshot } from "@/server/services/event-run.service";

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
  initialRun: EventRunSnapshot;
  isPremium?: boolean;
  mediaPurgeAt?: string | null;
  stats: EventOverviewStatsProps;
}

function daysLeft(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.ceil((ms - Date.now()) / (24 * 60 * 60 * 1000)));
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
  initialRun,
  isPremium = false,
  mediaPurgeAt = null,
  stats,
}: EventOverviewProps) {
  const tHome = useTranslations("eventWorkspace.home");
  const tMedia = useTranslations("eventWorkspace.media");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [run, setRun] = useState(initialRun);
  const [busy, setBusy] = useState(false);
  const { startUpgrade, upgradeBusy } = useEventPremiumUpgrade(eventId, orgSlug);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  useEffect(() => {
    setRun(initialRun);
  }, [initialRun]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("premium") !== "1") return;
    if (isPremium) {
      toast.success(tHome("premiumUnlocked"));
    }
    url.searchParams.delete("premium");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next);
    router.refresh();
  }, [isPremium, router, tHome]);

  const phase = run.phase;
  const ended = phase === "stopped" || phase === "locked";
  const waiting = phase === "idle";

  const statusText = useMemo(() => {
    if (phase === "live") {
      const left = daysLeft(run.liveDeadlineAt);
      if (left !== null) return tHome("statusLiveDays", { days: left });
      return tHome("statusLive");
    }
    if (phase === "paused") {
      const left = daysLeft(run.liveDeadlineAt);
      if (left !== null) return tHome("statusPausedDays", { days: left });
      return tHome("statusPaused");
    }
    if (phase === "stopped" || phase === "locked") {
      return tHome("statusEnded");
    }
    if (stats.pendingMedia > 0) {
      return tHome("statusPending", { count: stats.pendingMedia });
    }
    if (!enableGallery && !enableWall) {
      return tHome("statusInactive");
    }
    return tHome("statusWaiting");
  }, [
    enableGallery,
    enableWall,
    phase,
    run.liveDeadlineAt,
    stats.pendingMedia,
    tHome,
  ]);

  const retentionLabel = useMemo(() => {
    if (!ended || !mediaPurgeAt) return null;
    const days = daysLeft(mediaPurgeAt);
    if (days === null) return null;
    return tMedia("retentionCountdown", { days });
  }, [ended, mediaPurgeAt, tMedia]);

  const runAction = useCallback(
    async (action: "start" | "pause" | "resume" | "stop") => {
      if (!canEdit || busy) return;
      if (action === "stop") {
        const ok = await confirm({
          title: tHome("stop"),
          description: tHome("stopConfirm"),
          confirmLabel: tHome("stop"),
          cancelLabel: tCommon("cancel"),
          destructive: true,
        });
        if (!ok) return;
      }
      setBusy(true);
      try {
        const response = await fetch(`/api/events/${eventId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!response.ok) {
          toast.error(tHome("runActionFailed"));
          return;
        }
        const json = await response.json();
        setRun(json.data as EventRunSnapshot);
        router.refresh();
      } catch {
        toast.error(tHome("runActionFailed"));
      } finally {
        setBusy(false);
      }
    },
    [busy, canEdit, confirm, eventId, router, tCommon, tHome],
  );

  async function copyAlbumLink() {
    if (!albumHref) return;
    try {
      const absolute =
        typeof window !== "undefined"
          ? new URL(albumHref, window.location.origin).toString()
          : albumHref;
      await navigator.clipboard.writeText(absolute);
      toast.success(tHome("linkCopied"));
    } catch {
      toast.error(tHome("runActionFailed"));
    }
  }

  function scrollToShare() {
    document.getElementById("share-with-guests")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const base = `/org/${orgSlug}/events/${eventId}`;
  const wallDisabled = !enableWall || waiting || ended;

  const quickLinks: Array<{
    href?: string;
    onClick?: () => void;
    label: string;
    icon: typeof Images;
    disabled?: boolean;
  }> = [
    {
      href: `${base}/media`,
      label: tHome("quickMedia"),
      icon: Images,
    },
    {
      href: `${base}/settings`,
      label: tHome("quickWallSettings"),
      icon: MonitorPlay,
    },
    {
      href: `${base}/settings`,
      label: tHome("quickSettings"),
      icon: Settings2,
    },
    {
      onClick: () => void copyAlbumLink(),
      label: tHome("quickCopyAlbum"),
      icon: Link2,
      disabled: !albumHref,
    },
    {
      onClick: scrollToShare,
      label: tHome("showQr"),
      icon: QrCode,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {confirmDialog}
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {eventName}
              </h1>
              <EventTierBadge isPremium={isPremium} />
              <EventRunBadge phase={phase} />
            </div>
            <p className="text-sm text-muted-foreground">{statusText}</p>
            {retentionLabel ? (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {retentionLabel}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && !isPremium ? (
              <Button
                type="button"
                size="sm"
                className="h-9"
                disabled={upgradeBusy}
                onClick={() => void startUpgrade()}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {tHome("upgradePremium")}
              </Button>
            ) : null}
            {canEdit && run.canStart ? (
              <Button
                type="button"
                size="sm"
                className="h-9"
                disabled={busy}
                onClick={() => void runAction("start")}
              >
                <Play className="mr-1.5 h-3.5 w-3.5" />
                {tHome("start")}
              </Button>
            ) : null}
            {canEdit && run.canPause ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 bg-background"
                disabled={busy}
                onClick={() => void runAction("pause")}
              >
                <Pause className="mr-1.5 h-3.5 w-3.5" />
                {tHome("pause")}
              </Button>
            ) : null}
            {canEdit && run.canResume ? (
              <Button
                type="button"
                size="sm"
                className="h-9"
                disabled={busy}
                onClick={() => void runAction("resume")}
              >
                <Play className="mr-1.5 h-3.5 w-3.5" />
                {tHome("resume")}
              </Button>
            ) : null}
            {canEdit && run.canStop ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 bg-background"
                disabled={busy}
                onClick={() => void runAction("stop")}
              >
                <Square className="mr-1.5 h-3.5 w-3.5" />
                {tHome("stop")}
              </Button>
            ) : null}
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
              <a
                href={`/e/${eventSlug}/wall`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {tHome("openWall")}
              </a>
            </Button>
          </div>
        </div>

        <nav aria-label={tHome("quickActionsLabel")} className="flex flex-wrap gap-x-4 gap-y-2">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            const className =
              "inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40";
            if (item.href) {
              return (
                <Link key={item.label} href={item.href} className={className}>
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                className={className}
                disabled={item.disabled}
                onClick={item.onClick}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>
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
        enableGallery={enableGallery}
        enableWall={enableWall}
        canEdit={canEdit}
      />
    </div>
  );
}

// Keep phase type exported for callers that import from this module historically.
export type { EventRunPhase };
