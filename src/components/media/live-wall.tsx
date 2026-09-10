"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminLoginDialog } from "@/components/media/admin-login-dialog";
import { WallCustomizationSheet } from "@/components/media/wall-customization-sheet";
import type {
  WallAnnouncement,
  WallMediaItem,
  WallReactionEvent,
} from "@/components/media/wall/types";
import { WallAnnouncementOverlay } from "@/components/media/wall/wall-announcement";
import { WallFloatingReactions } from "@/components/media/wall/wall-floating-reactions";
import { WallMarquee } from "@/components/media/wall/wall-marquee";
import { WallQrPanel } from "@/components/media/wall/wall-qr-panel";
import { WallSideStream } from "@/components/media/wall/wall-side-stream";
import { WallStage } from "@/components/media/wall/wall-stage";
import { useWallSound, WallToolbar } from "@/components/media/wall-toolbar";
import { EventThemeScope } from "@/components/events/event-theme-scope";
import { cn } from "@/lib/utils";
import type { WallDisplaySettings } from "@/server/events/wall-settings";
import { DEFAULT_WALL_DISPLAY_SETTINGS } from "@/server/events/wall-settings";

const CHROME_TOP_ZONE_PX = 72;
const CHROME_HIDE_DELAY_MS = 2500;
const DEFAULT_ANNOUNCEMENT_DISPLAY_SEC = 12;

function seenAnnouncementStorageKey(eventSlug: string) {
  return `eventos-wall-announcement-seen:${eventSlug}`;
}

function loadSeenAnnouncementIds(eventSlug: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(seenAnnouncementStorageKey(eventSlug));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function persistSeenAnnouncementId(eventSlug: string, id: string, seen: Set<string>) {
  seen.add(id);
  try {
    sessionStorage.setItem(
      seenAnnouncementStorageKey(eventSlug),
      JSON.stringify([...seen].slice(-40)),
    );
  } catch {
    // ignore quota / private mode
  }
}

interface WallConfig {
  wall: WallDisplaySettings;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
    logoUrl?: string | null;
  };
  appearance?: {
    captionTheme?: "dark" | "light";
    removeBranding?: boolean;
  };
  uploadUrl: string | null;
  uploadQrImageUrl: string | null;
  eventName: string;
}

interface LiveWallProps {
  eventSlug: string;
  eventId?: string;
  canEdit?: boolean;
  callbackUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  settingsHref?: string;
}

export function LiveWall({
  eventSlug,
  eventId,
  canEdit = false,
  callbackUrl,
  primaryColor: fallbackPrimary = "#C4A574",
  secondaryColor: fallbackSecondary = "#F59E0B",
  settingsHref,
}: LiveWallProps) {
  const t = useTranslations("publicEvent");
  const [media, setMedia] = useState<WallMediaItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<WallConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [reactionEvents, setReactionEvents] = useState<WallReactionEvent[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState<WallAnnouncement | null>(
    null,
  );
  const [liveMarqueeLine, setLiveMarqueeLine] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const hideChromeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenAnnouncementIdsRef = useRef<Set<string>>(new Set());
  const { soundEnabled, toggleSound } = useWallSound();

  const wallSettings = config?.wall ?? DEFAULT_WALL_DISPLAY_SETTINGS;
  const primaryColor = config?.theme.primaryColor ?? fallbackPrimary;
  const secondaryColor = config?.theme.secondaryColor ?? fallbackSecondary;

  const clearHideChromeTimer = useCallback(() => {
    if (hideChromeTimerRef.current) {
      clearTimeout(hideChromeTimerRef.current);
      hideChromeTimerRef.current = null;
    }
  }, []);

  const scheduleHideChrome = useCallback(() => {
    clearHideChromeTimer();
    hideChromeTimerRef.current = setTimeout(() => {
      setChromeVisible(false);
    }, CHROME_HIDE_DELAY_MS);
  }, [clearHideChromeTimer]);

  useEffect(() => {
    function syncFullscreen() {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        clearHideChromeTimer();
        setChromeVisible(true);
      } else {
        setChromeVisible(true);
        scheduleHideChrome();
      }
    }

    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      clearHideChromeTimer();
    };
  }, [clearHideChromeTimer, scheduleHideChrome]);

  useEffect(() => {
    if (!isFullscreen) return;

    function onPointerMove(event: PointerEvent) {
      if (event.clientY < CHROME_TOP_ZONE_PX) {
        setChromeVisible(true);
        clearHideChromeTimer();
        return;
      }
      scheduleHideChrome();
    }

    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [isFullscreen, clearHideChromeTimer, scheduleHideChrome]);

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/wall/${eventSlug}/config`);
      if (response.ok) {
        const json = await response.json();
        setConfig(json.data);
      }
    } catch {
      // Config is optional for graceful degradation
    }
  }, [eventSlug]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    const source = new EventSource(`/api/public/wall/${eventSlug}/stream`);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          media?: WallMediaItem[];
          reactions?: WallReactionEvent[];
          announcement?: WallAnnouncement | null;
          initial?: boolean;
        };

        if (data.announcement?.id) {
          const id = data.announcement.id;
          const seen = seenAnnouncementIdsRef.current;
          if (!seen.has(id)) {
            persistSeenAnnouncementId(eventSlug, id, seen);
            setActiveAnnouncement(data.announcement);
          }
        }

        if (data.initial) {
          setMedia(data.media ?? []);
          return;
        }

        if (data.media && data.media.length > 0) {
          setMedia((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newItems = data.media!.filter((m) => !existingIds.has(m.id));
            if (newItems.length > 0) {
              setLiveMarqueeLine(t("wallNewPhoto"));
              window.setTimeout(() => setLiveMarqueeLine(null), 12_000);
            }
            return [...newItems, ...prev].slice(0, 100);
          });
        }

        if (data.reactions && data.reactions.length > 0) {
          setReactionEvents(data.reactions);
          setMedia((prev) => {
            let changed = false;
            const next = prev.map((item) => {
              const incoming = data.reactions!.filter((r) => r.mediaId === item.id);
              if (incoming.length === 0) return item;
              changed = true;
              const reactionCounts = { ...(item.reactionCounts ?? {}) };
              for (const reaction of incoming) {
                reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] ?? 0) + 1;
              }
              return { ...item, reactionCounts };
            });
            return changed ? next : prev;
          });
        }
      } catch {
        // Ignore malformed events
      }
    };

    return () => source.close();
  }, [eventSlug, t]);

  useEffect(() => {
    seenAnnouncementIdsRef.current = loadSeenAnnouncementIds(eventSlug);
  }, [eventSlug]);

  const slideshowItems = media;
  const currentItem = slideshowItems[currentIndex] ?? null;

  useEffect(() => {
    if (!activeAnnouncement) return;
    const durationSec =
      typeof activeAnnouncement.durationSec === "number" &&
      Number.isFinite(activeAnnouncement.durationSec)
        ? Math.min(60, Math.max(5, Math.round(activeAnnouncement.durationSec)))
        : DEFAULT_ANNOUNCEMENT_DISPLAY_SEC;
    const timer = window.setTimeout(() => {
      setActiveAnnouncement(null);
    }, durationSec * 1000);
    return () => window.clearTimeout(timer);
  }, [activeAnnouncement]);

  useEffect(() => {
    if (slideshowItems.length <= 1 || activeAnnouncement) return;

    const item = slideshowItems[currentIndex];
    const isVideo = item?.mimeType?.startsWith("video/");
    const durationMs = isVideo
      ? wallSettings.playVideoFullLength
        ? wallSettings.videoDurationSec * 1000 * 2
        : wallSettings.videoDurationSec * 1000
      : item?.caption && !item.url
        ? wallSettings.textDurationSec * 1000
        : wallSettings.imageDurationSec * 1000;

    const timer = window.setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % slideshowItems.length);
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [currentIndex, slideshowItems, wallSettings, activeAnnouncement]);

  useEffect(() => {
    if (currentIndex >= slideshowItems.length && slideshowItems.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, slideshowItems.length]);

  // Preload next image
  useEffect(() => {
    if (slideshowItems.length < 2) return;
    const next = slideshowItems[(currentIndex + 1) % slideshowItems.length];
    if (!next || next.mimeType?.startsWith("video/")) return;
    const img = new Image();
    img.src = next.url;
  }, [currentIndex, slideshowItems]);

  const sidePhotos = useMemo(() => {
    if (wallSettings.hideSideImages) return [];
    return slideshowItems.filter((item) => !item.mimeType?.startsWith("video/"));
  }, [slideshowItems, wallSettings.hideSideImages]);

  const announcementImageUrls = useMemo(() => {
    return slideshowItems
      .filter((item) => item.url && !item.mimeType?.startsWith("video/"))
      .slice(0, 9)
      .map((item) => item.url);
  }, [slideshowItems]);

  const appearBurst = useMemo(
    () =>
      currentItem
        ? {
            mediaId: currentItem.id,
            appearKey: `${currentIndex}-${currentItem.id}`,
            reactionCounts: currentItem.reactionCounts,
          }
        : null,
    [currentItem, currentIndex],
  );

  function handleCustomize() {
    if (canEdit && eventId) {
      setCustomizeOpen(true);
      return;
    }
    setLoginOpen(true);
  }

  const marqueeText =
    wallSettings.marqueeText?.trim() ||
    [t("wallMarqueePrompt1"), t("wallMarqueePrompt2"), t("wallMarqueePrompt3")].join(
      "   ·   ",
    );

  const backgroundOpacity = (wallSettings.backgroundOpacity ?? 100) / 100;

  return (
    <EventThemeScope
      className="relative flex h-dvh flex-col overflow-hidden text-white"
      colors={{
        primaryColor,
        secondaryColor,
        accentColor: config?.theme.accentColor ?? primaryColor,
      }}
    >
      {wallSettings.backgroundUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${wallSettings.backgroundUrl})`,
              opacity: backgroundOpacity,
            }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </>
      ) : currentItem ? (
        <div className="absolute inset-0 bg-neutral-950" />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          }}
        />
      )}

      <header
        className={cn(
          "absolute inset-x-0 top-0 z-40 flex h-14 items-center gap-3 px-4 sm:px-6",
          "motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out",
          chromeVisible ? "translate-y-0 pointer-events-auto" : "-translate-y-full pointer-events-none",
        )}
        onPointerEnter={() => {
          if (!isFullscreen) return;
          setChromeVisible(true);
          clearHideChromeTimer();
        }}
        onPointerLeave={() => {
          if (!isFullscreen) return;
          scheduleHideChrome();
        }}
      >
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold tracking-tight sm:text-xl">
          {config?.eventName ?? t("wallTitle")}
        </h1>

        <div className="flex shrink-0 justify-center">
          <WallToolbar
            onCustomize={handleCustomize}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            eventId={eventId}
            canNotify={Boolean(canEdit && eventId)}
          />
        </div>

        <div className="flex flex-1 items-center justify-end">
          <span
            className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
            title={connected ? t("wallLive") : t("wallOffline")}
          />
        </div>
      </header>

      <main className="absolute inset-0 z-10">
        <WallStage
          item={currentItem}
          transitionMs={wallSettings.transitionMs}
          soundEnabled={soundEnabled}
          playVideoFullLength={wallSettings.playVideoFullLength}
          customBackgroundUrl={wallSettings.backgroundUrl}
          hideReactions={wallSettings.hideLikes}
          hideNickname={wallSettings.hideNickname || Boolean(activeAnnouncement)}
          hideCaption={wallSettings.hideCaption || Boolean(activeAnnouncement)}
          captionTheme={config?.appearance?.captionTheme ?? "dark"}
          emptyState={
            <div className="text-center">
              <p className="text-xl font-medium">{t("wallEmpty")}</p>
              <p className="mt-2 max-w-md text-white/70">{t("wallEmptyDesc")}</p>
            </div>
          }
        />

        {sidePhotos.length > 0 ? (
          <>
            <WallSideStream
              items={sidePhotos}
              selectedId={currentItem?.id}
              side="left"
            />
            <WallSideStream
              items={sidePhotos}
              selectedId={currentItem?.id}
              side="right"
            />
          </>
        ) : null}

        <WallQrPanel
          imageUrl={config?.uploadQrImageUrl ?? null}
          uploadUrl={config?.uploadUrl}
          size={wallSettings.qrSize}
          label={t("scanToUpload")}
          hidden={wallSettings.hideQrCode}
        />

        <WallFloatingReactions
          events={reactionEvents}
          appearBurst={appearBurst}
          hidden={wallSettings.hideLikes || Boolean(activeAnnouncement)}
        />

        <WallMarquee
          text={marqueeText}
          speedSec={wallSettings.marqueeSpeed}
          hidden={wallSettings.hideMarquee || Boolean(activeAnnouncement)}
          liveLine={liveMarqueeLine}
        />

        {activeAnnouncement ? (
          <WallAnnouncementOverlay
            title={activeAnnouncement.title}
            body={activeAnnouncement.body}
            imageUrls={announcementImageUrls}
            label={t("wallAnnouncementLabel")}
          />
        ) : null}
      </main>

      {canEdit && eventId ? (
        <WallCustomizationSheet
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
          eventId={eventId}
          initialSettings={wallSettings}
          onSaved={(wall) => {
            setConfig((prev) => (prev ? { ...prev, wall } : prev));
            void loadConfig();
          }}
          settingsHref={settingsHref}
        />
      ) : null}

      <AdminLoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        callbackUrl={callbackUrl ?? `/e/${eventSlug}/wall`}
      />
    </EventThemeScope>
  );
}
