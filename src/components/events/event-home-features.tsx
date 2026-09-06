"use client";

import { ImageIcon, MonitorPlay } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminLoginDialog } from "@/components/media/admin-login-dialog";
import { WallCustomizationSheet } from "@/components/media/wall-customization-sheet";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { WallDisplaySettings } from "@/server/events/wall-settings";
import { cn } from "@/lib/utils";

interface MediaPreviewItem {
  id: string;
  url: string;
  caption: string | null;
  fileName: string | null;
}

interface EventHomeFeaturesProps {
  eventId: string;
  eventSlug: string;
  orgSlug: string;
  albumHref: string | null;
  enableGallery: boolean;
  enableWall: boolean;
  canEdit: boolean;
}

export function EventHomeFeatures({
  eventId,
  eventSlug,
  orgSlug,
  albumHref,
  enableGallery,
  enableWall,
  canEdit,
}: EventHomeFeaturesProps) {
  const t = useTranslations("eventWorkspace.home");
  const tHub = useTranslations("events.mediaHub");
  const tMedia = useTranslations("eventWorkspace.media");
  const [previews, setPreviews] = useState<MediaPreviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [wallSettings, setWallSettings] = useState<WallDisplaySettings | undefined>();

  const settingsHref = `/org/${orgSlug}/events/${eventId}/settings`;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const mediaRes = await fetch(`/api/events/${eventId}/media`);
      if (mediaRes.ok) {
        const json = await mediaRes.json();
        const media = (json.data.media ?? []) as MediaPreviewItem[];
        setPreviews(media.slice(0, 9));
      }
    } catch {
      toast.error(tHub("loadError"));
    }
    setIsLoading(false);
  }, [eventId, tHub]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleCustomizeClick() {
    if (canEdit) {
      setCustomizeOpen(true);
      return;
    }
    setLoginOpen(true);
  }

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-2" aria-label={t("featuresLabel")}>
        <article className="dashboard-surface flex flex-col overflow-hidden">
          <div className="space-y-1 border-b border-border/40 px-5 py-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold tracking-tight">{t("albumTitle")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t("albumDescription")}</p>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-5">
            <FeaturePreview
              isLoading={isLoading}
              items={previews}
              emptyTitle={t("albumEmptyTitle")}
              emptyBody={t("albumEmptyBody")}
              variant="masonry"
            />

            {!enableGallery ? (
              <p className="text-xs text-muted-foreground">{tHub("galleryDisabled")}</p>
            ) : null}

            <div className="mt-auto flex flex-wrap gap-2">
              <Button
                asChild
                size="sm"
                className="h-9"
                disabled={!enableGallery || !albumHref}
              >
                <a href={albumHref ?? "#"} target="_blank" rel="noopener noreferrer">
                  {t("openAlbum")}
                </a>
              </Button>
              <Button variant="outline" size="sm" className="h-9 bg-background" asChild>
                <Link href={`/org/${orgSlug}/events/${eventId}/media`}>
                  {tMedia("title")}
                </Link>
              </Button>
            </div>
          </div>
        </article>

        <article className="dashboard-surface flex flex-col overflow-hidden">
          <div className="space-y-1 border-b border-border/40 px-5 py-4">
            <div className="flex items-center gap-2">
              <MonitorPlay className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold tracking-tight">{t("wallTitle")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t("wallDescription")}</p>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-5">
            <FeaturePreview
              isLoading={isLoading}
              items={previews}
              emptyTitle={t("wallEmptyTitle")}
              emptyBody={t("wallEmptyBody")}
              variant="wall"
            />

            {!enableWall ? (
              <p className="text-xs text-muted-foreground">{tHub("wallDisabled")}</p>
            ) : null}

            <div className="mt-auto flex flex-wrap gap-2">
              <Button asChild size="sm" className="h-9" disabled={!enableWall}>
                <a href={`/e/${eventSlug}/wall`} target="_blank" rel="noopener noreferrer">
                  {t("openWall")}
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 bg-background"
                disabled={!enableWall}
                onClick={handleCustomizeClick}
              >
                {tHub("customizeWall")}
              </Button>
              {!canEdit && settingsHref ? (
                <Button variant="ghost" size="sm" className="h-9" asChild>
                  <Link href={settingsHref}>{tHub("goToSettings")}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </article>
      </section>

      {canEdit ? (
        <WallCustomizationSheet
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
          eventId={eventId}
          initialSettings={wallSettings}
          onSaved={setWallSettings}
          settingsHref={settingsHref}
        />
      ) : null}

      <AdminLoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        callbackUrl={`/e/${eventSlug}`}
      />
    </>
  );
}

function FeaturePreview({
  isLoading,
  items,
  emptyTitle,
  emptyBody,
  variant,
}: {
  isLoading: boolean;
  items: MediaPreviewItem[];
  emptyTitle: string;
  emptyBody: string;
  variant: "masonry" | "wall";
}) {
  if (isLoading) {
    return <div className="aspect-[16/10] animate-pulse rounded-lg bg-muted/60" />;
  }

  if (items.length === 0) {
    return (
      <div className="flex aspect-[16/10] flex-col items-center justify-center rounded-lg bg-muted/30 px-6 text-center">
        <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{emptyBody}</p>
      </div>
    );
  }

  if (variant === "wall") {
    const hero = items[0];
    const side = items.slice(1, 4);
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-neutral-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.url}
          alt={hero.caption ?? hero.fileName ?? ""}
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-x-0 bottom-0 flex gap-1.5 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-8">
          {side.map((item) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.id}
              src={item.url}
              alt=""
              className="h-10 w-10 rounded object-cover ring-1 ring-white/20"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid aspect-[16/10] grid-cols-3 grid-rows-3 gap-1 overflow-hidden rounded-lg bg-muted/20">
      {items.slice(0, 9).map((item, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={item.id}
          src={item.url}
          alt={item.caption ?? item.fileName ?? ""}
          className={cn(
            "h-full w-full object-cover",
            index === 0 && "col-span-2 row-span-2",
          )}
        />
      ))}
    </div>
  );
}
