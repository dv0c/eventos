"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminLoginDialog } from "@/components/media/admin-login-dialog";
import { WallCustomizationSheet } from "@/components/media/wall-customization-sheet";
import { useWallSound, WallToolbar } from "@/components/media/wall-toolbar";
import type { WallDisplaySettings } from "@/server/events/wall-settings";
import { DEFAULT_WALL_DISPLAY_SETTINGS } from "@/server/events/wall-settings";

interface WallMediaItem {
  id: string;
  url: string;
  caption: string | null;
  isFeatured: boolean;
  mimeType?: string;
  createdAt: string;
}

interface WallConfig {
  wall: WallDisplaySettings;
  theme: {
    primaryColor: string;
    secondaryColor: string;
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
}

export function LiveWall({
  eventSlug,
  eventId,
  canEdit = false,
  callbackUrl,
  primaryColor: fallbackPrimary = "#8B5CF6",
  secondaryColor: fallbackSecondary = "#F59E0B",
}: LiveWallProps) {
  const t = useTranslations("publicEvent");
  const [media, setMedia] = useState<WallMediaItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<WallConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { soundEnabled, toggleSound } = useWallSound();

  const wallSettings = config?.wall ?? DEFAULT_WALL_DISPLAY_SETTINGS;
  const primaryColor = config?.theme.primaryColor ?? fallbackPrimary;
  const secondaryColor = config?.theme.secondaryColor ?? fallbackSecondary;

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
          media: WallMediaItem[];
          initial?: boolean;
        };

        if (data.initial) {
          setMedia(data.media);
        } else if (data.media.length > 0) {
          setMedia((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newItems = data.media.filter((m) => !existingIds.has(m.id));
            return [...newItems, ...prev].slice(0, 100);
          });
        }
      } catch {
        // Ignore malformed events
      }
    };

    return () => source.close();
  }, [eventSlug]);

  const slideshowItems = useMemo(() => {
    if (media.length === 0) return [];
    return media;
  }, [media]);

  const currentItem = slideshowItems[currentIndex];

  useEffect(() => {
    if (slideshowItems.length <= 1) return;

    const item = slideshowItems[currentIndex];
    const isVideo = item?.mimeType?.startsWith("video/");
    const durationMs = isVideo
      ? wallSettings.playVideoFullLength
        ? wallSettings.videoDurationSec * 1000 * 2
        : wallSettings.videoDurationSec * 1000
      : item?.caption
        ? wallSettings.textDurationSec * 1000
        : wallSettings.imageDurationSec * 1000;

    const timer = window.setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % slideshowItems.length);
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [currentIndex, slideshowItems, wallSettings]);

  const sideImages = useMemo(() => {
    if (wallSettings.hideSideImages || slideshowItems.length < 3) return [];
    return slideshowItems.filter((_, i) => i !== currentIndex).slice(0, 6);
  }, [slideshowItems, currentIndex, wallSettings.hideSideImages]);

  function handleCustomize() {
    if (canEdit && eventId) {
      setCustomizeOpen(true);
      return;
    }
    setLoginOpen(true);
  }

  const backgroundStyle = wallSettings.backgroundUrl
    ? {
        backgroundImage: `url(${wallSettings.backgroundUrl})`,
        backgroundSize: "cover" as const,
        backgroundPosition: "center" as const,
      }
    : {
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-white">
      <div className="absolute inset-0" style={backgroundStyle} />
      {wallSettings.backgroundUrl ? (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      ) : null}

      <div className="relative z-10">
        <WallToolbar
          onCustomize={handleCustomize}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-2">
        <h1 className="text-xl font-bold tracking-tight">
          {config?.eventName ?? t("wallTitle")}
        </h1>
        <span
          className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
          title={connected ? t("wallLive") : t("wallOffline")}
        />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        {!wallSettings.hideSideImages && sideImages.length > 0 ? (
          <SideImageColumn items={sideImages.slice(0, 3)} position="left" />
        ) : null}

        <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-6">
          {slideshowItems.length === 0 ? (
            <div className="text-center">
              <p className="text-xl font-medium">{t("wallEmpty")}</p>
              <p className="mt-2 max-w-md text-white/70">{t("wallEmptyDesc")}</p>
            </div>
          ) : currentItem ? (
            <figure className="relative w-full overflow-hidden rounded-2xl shadow-2xl">
              {currentItem.mimeType?.startsWith("video/") ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  key={currentItem.id}
                  src={currentItem.url}
                  className="max-h-[50vh] w-full object-cover"
                  autoPlay
                  muted={!soundEnabled}
                  playsInline
                  loop={!wallSettings.playVideoFullLength}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={currentItem.id}
                  src={currentItem.url}
                  alt={currentItem.caption ?? ""}
                  className="max-h-[50vh] w-full object-cover"
                />
              )}
              {!wallSettings.hideCaption && currentItem.caption ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 px-4 py-3 text-sm">
                  {currentItem.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          {!wallSettings.hideQrCode && config?.uploadQrImageUrl ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/10 p-6 backdrop-blur-md">
              <p className="text-sm font-medium">{t("scanToUpload")}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.uploadQrImageUrl}
                alt={t("scanToUpload")}
                className="h-40 w-40 rounded-xl bg-white p-2"
              />
            </div>
          ) : null}
        </div>

        {!wallSettings.hideSideImages && sideImages.length > 3 ? (
          <SideImageColumn items={sideImages.slice(3, 6)} position="right" />
        ) : null}
      </main>

      {canEdit && eventId ? (
        <WallCustomizationSheet
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
          eventId={eventId}
          initialSettings={wallSettings}
          onSaved={(wall) => setConfig((prev) => (prev ? { ...prev, wall } : prev))}
        />
      ) : null}

      <AdminLoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        callbackUrl={callbackUrl ?? `/e/${eventSlug}/wall`}
      />
    </div>
  );
}

function SideImageColumn({
  items,
  position,
}: {
  items: WallMediaItem[];
  position: "left" | "right";
}) {
  return (
    <div
      className={`hidden w-28 flex-col gap-3 lg:flex ${position === "left" ? "mr-4" : "ml-4"}`}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className="animate-pulse overflow-hidden rounded-lg opacity-70"
          style={{ animationDelay: `${index * 200}ms` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt="" className="h-20 w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
