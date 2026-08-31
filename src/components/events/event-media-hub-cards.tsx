"use client";

import type { QRCodeType } from "@prisma/client";
import { ImageIcon, MonitorPlay } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminLoginDialog } from "@/components/media/admin-login-dialog";
import { DisplayOnIcons, WallCustomizationSheet } from "@/components/media/wall-customization-sheet";
import { QrLinkRow, QrPreview } from "@/components/media/qr-link-row";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { WallDisplaySettings } from "@/server/events/wall-settings";
import { cn } from "@/lib/utils";

interface QrCodeItem {
  id: string;
  type: QRCodeType;
  url: string;
  downloadUrl: string | null;
}

interface EventMediaHubCardsProps {
  eventId?: string;
  eventSlug: string;
  enableGallery: boolean;
  enableWall: boolean;
  canEdit?: boolean;
  callbackUrl?: string;
  variant?: "host" | "public";
}

export function EventMediaHubCards({
  eventId,
  eventSlug,
  enableGallery,
  enableWall,
  canEdit = false,
  callbackUrl = `/e/${eventSlug}`,
  variant = "host",
}: EventMediaHubCardsProps) {
  const t = useTranslations("events.mediaHub");
  const [qrCodes, setQrCodes] = useState<QrCodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(variant === "host");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [wallSettings, setWallSettings] = useState<WallDisplaySettings | undefined>();

  const uploadCode = qrCodes.find((c) => c.type === "UPLOAD");
  const wallCode = qrCodes.find((c) => c.type === "WALL");

  const loadQrCodes = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      let response = await fetch(`/api/events/${eventId}/qr`);
      if (response.ok) {
        let json = await response.json();
        const codes = json.data.qrCodes as QrCodeItem[];
        const needsGenerate = codes.some(
          (c) => (c.type === "UPLOAD" || c.type === "WALL") && !c.downloadUrl,
        );
        if (needsGenerate) {
          await fetch(`/api/events/${eventId}/qr`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          response = await fetch(`/api/events/${eventId}/qr`);
          if (response.ok) {
            json = await response.json();
          }
        }
        setQrCodes(json.data.qrCodes);
      }
    } catch {
      toast.error(t("loadError"));
    }
    setIsLoading(false);
  }, [eventId, t]);

  useEffect(() => {
    if (variant === "host" && eventId) {
      void loadQrCodes();
    }
  }, [variant, eventId, loadQrCodes]);

  useEffect(() => {
    if (variant === "public") {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setQrCodes([
        {
          id: "upload",
          type: "UPLOAD" as QRCodeType,
          url: `${origin}/e/${eventSlug}/upload`,
          downloadUrl: null,
        },
        {
          id: "wall",
          type: "WALL" as QRCodeType,
          url: `${origin}/e/${eventSlug}/wall`,
          downloadUrl: null,
        },
      ]);
      setIsLoading(false);
    }
  }, [variant, eventSlug]);

  function handleCustomizeClick() {
    if (canEdit && eventId) {
      setCustomizeOpen(true);
      return;
    }
    setLoginOpen(true);
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <MediaHubCard
          title={t("albumTitle")}
          description={t("albumDescription")}
          icon={ImageIcon}
          enabled={enableGallery}
          disabledLabel={t("galleryDisabled")}
          isLoading={isLoading}
        >
          {uploadCode ? (
            <div className="space-y-4">
              <QrLinkRow
                url={uploadCode.url}
                openHref={`/e/${eventSlug}/upload`}
                openExternal={variant === "public"}
                downloadUrl={uploadCode.downloadUrl}
                disabled={!enableGallery}
              />
              <div className="flex items-start gap-4">
                <QrPreview downloadUrl={uploadCode.downloadUrl} alt={t("albumTitle")} />
                <div className="hidden h-36 w-20 rounded-2xl border-2 border-muted bg-white/60 sm:block" />
              </div>
            </div>
          ) : null}
        </MediaHubCard>

        <MediaHubCard
          title={t("wallTitle")}
          description={t("wallDescription")}
          icon={MonitorPlay}
          enabled={enableWall}
          disabledLabel={t("wallDisabled")}
          isLoading={isLoading}
        >
          {wallCode ? (
            <div className="space-y-4">
              <QrLinkRow
                url={wallCode.url}
                openHref={`/e/${eventSlug}/wall`}
                openExternal={variant === "public"}
                downloadUrl={wallCode.downloadUrl}
                disabled={!enableWall}
              />
              <div className="overflow-hidden rounded-xl bg-neutral-900/90 p-1">
                <div className="flex h-28 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 text-xs text-white/60">
                  {t("wallPreview")}
                </div>
              </div>
              <DisplayOnIcons />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomizeClick}
                disabled={!enableWall}
              >
                {t("customizeWall")}
              </Button>
            </div>
          ) : null}
        </MediaHubCard>
      </div>

      {canEdit && eventId ? (
        <WallCustomizationSheet
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
          eventId={eventId}
          initialSettings={wallSettings}
          onSaved={setWallSettings}
        />
      ) : null}

      <AdminLoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        callbackUrl={callbackUrl}
      />
    </>
  );
}

function MediaHubCard({
  title,
  description,
  icon: Icon,
  enabled,
  disabledLabel,
  isLoading,
  children,
}: {
  title: string;
  description: string;
  icon: typeof ImageIcon;
  enabled: boolean;
  disabledLabel: string;
  isLoading: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "event-surface space-y-4 p-6",
        !enabled && "opacity-60",
      )}
      style={{ background: "hsl(var(--secondary) / 0.35)" }}
    >
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {!enabled ? (
        <p className="text-sm text-muted-foreground">{disabledLabel}</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">...</p>
      ) : (
        children
      )}
    </article>
  );
}

export function EventMediaHubSettingsLink({
  eventId,
  orgSlug,
}: {
  eventId: string;
  orgSlug: string;
}) {
  const t = useTranslations("events.mediaHub");

  return (
    <Button variant="link" size="sm" asChild className="h-auto p-0 text-primary">
      <Link href={`/org/${orgSlug}/events/${eventId}/settings`}>
        {t("goToSettings")}
      </Link>
    </Button>
  );
}
