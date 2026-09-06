"use client";

import type { QRCodeType } from "@prisma/client";
import { CircleHelp, ImageIcon, MonitorPlay } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  WallScreenMockup,
} from "@/components/events/media-hub-mockups";
import { AdminLoginDialog } from "@/components/media/admin-login-dialog";
import { DisplayOnIcons } from "@/components/media/display-on-icons";
import { WallCustomizationSheet } from "@/components/media/wall-customization-sheet";
import { QrActions, QrPreview, QrUrlField } from "@/components/media/qr-link-row";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { WallDisplaySettings } from "@/server/events/wall-settings";
import { cn } from "@/lib/utils";

interface QrCodeItem {
  id: string;
  type: QRCodeType;
  url: string;
  imageUrl: string;
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
  settingsHref?: string;
}

export function EventMediaHubCards({
  eventId,
  eventSlug,
  enableGallery,
  enableWall,
  canEdit = false,
  callbackUrl = `/e/${eventSlug}`,
  variant = "host",
  settingsHref,
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
      const response = await fetch(`/api/events/${eventId}/qr`);
      if (response.ok) {
        const json = await response.json();
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
          url: `${origin}/a/preview-token`,
          imageUrl: "",
          downloadUrl: null,
        },
        {
          id: "wall",
          type: "WALL" as QRCodeType,
          url: `${origin}/e/${eventSlug}/wall`,
          imageUrl: "",
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
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <MediaHubCard
          title={t("albumTitle")}
          description={t("albumDescription")}
          icon={ImageIcon}
          enabled={enableGallery}
          disabledLabel={t("galleryDisabled")}
          settingsHref={settingsHref}
          isLoading={isLoading}
        >
          {uploadCode ? (
            <AlbumCardBody
              code={uploadCode}
              openHref={uploadCode.url}
              openExternal={variant === "public"}
              previewAlt={t("albumTitle")}
              disabled={!enableGallery}
            />
          ) : null}
        </MediaHubCard>

        <MediaHubCard
          title={t("wallTitle")}
          description={t("wallDescription")}
          icon={MonitorPlay}
          enabled={enableWall}
          disabledLabel={t("wallDisabled")}
          settingsHref={settingsHref}
          isLoading={isLoading}
        >
          {wallCode ? (
            <WallCardBody
              code={wallCode}
              eventSlug={eventSlug}
              openHref={`/e/${eventSlug}/wall`}
              openExternal={variant === "public"}
              disabled={!enableWall}
              onCustomize={handleCustomizeClick}
            />
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
          settingsHref={settingsHref}
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

function UrlOpenRow({
  code,
  openHref,
  openExternal,
  disabled,
}: {
  code: QrCodeItem;
  openHref: string;
  openExternal: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-0 flex-1">
        <QrUrlField url={code.url} disabled={disabled} />
      </div>
      <QrActions
        openHref={openHref}
        openExternal={openExternal}
        downloadUrl={null}
        disabled={disabled}
        className="flex-row"
      />
    </div>
  );
}

function AlbumCardBody({
  code,
  openHref,
  openExternal,
  previewAlt,
  disabled,
}: {
  code: QrCodeItem;
  openHref: string;
  openExternal: boolean;
  previewAlt: string;
  disabled: boolean;
}) {
  const downloadUrl = code.imageUrl
    ? `${code.imageUrl}&download=1`
    : code.downloadUrl;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <UrlOpenRow
        code={code}
        openHref={openHref}
        openExternal={openExternal}
        disabled={disabled}
      />
      <a
        href={downloadUrl ?? undefined}
        download={downloadUrl ? true : undefined}
        target={downloadUrl ? "_blank" : undefined}
        rel={downloadUrl ? "noopener noreferrer" : undefined}
        className={cn(
          "flex min-h-[240px] flex-1 items-center justify-center rounded-2xl border-2 border-primary/30 bg-background p-4 sm:min-h-[280px]",
          downloadUrl && "transition-colors hover:border-primary/50",
          disabled && "pointer-events-none opacity-60",
        )}
        aria-label={previewAlt}
      >
        <QrPreview
          imageUrl={code.imageUrl || null}
          downloadUrl={downloadUrl}
          alt={previewAlt}
          className="h-full max-h-[320px] w-full max-w-[320px] border-0 bg-transparent object-contain p-0"
        />
      </a>
    </div>
  );
}

function WallCardBody({
  code,
  eventSlug,
  openHref,
  openExternal,
  disabled,
  onCustomize,
}: {
  code: QrCodeItem;
  eventSlug: string;
  openHref: string;
  openExternal: boolean;
  disabled: boolean;
  onCustomize: () => void;
}) {
  const t = useTranslations("events.mediaHub");

  return (
    <div className="space-y-5">
      <UrlOpenRow
        code={code}
        openHref={openHref}
        openExternal={openExternal}
        disabled={disabled}
      />
      <WallScreenMockup qrImageUrl={code.imageUrl || null} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 pt-4">
        <DisplayOnIcons />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="link"
            size="sm"
            className="h-auto gap-1 p-0 text-primary"
            asChild
          >
            <Link href={`/e/${eventSlug}/wall`} target="_blank">
              <CircleHelp className="h-3.5 w-3.5" />
              {t("howToDoIt")}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-primary/20 bg-background"
            onClick={onCustomize}
            disabled={disabled}
          >
            {t("customizeWall")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MediaHubCard({
  title,
  description,
  icon: Icon,
  enabled,
  disabledLabel,
  settingsHref,
  isLoading,
  children,
}: {
  title: string;
  description: string;
  icon: typeof ImageIcon;
  enabled: boolean;
  disabledLabel: string;
  settingsHref?: string;
  isLoading: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("events.mediaHub");

  return (
    <article
      className={cn(
        "flex flex-col space-y-5 rounded-2xl border border-primary/10 bg-primary/[0.07] p-5 shadow-sm sm:p-6",
        !enabled && "opacity-70",
      )}
    >
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {!enabled ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{disabledLabel}</p>
          {settingsHref ? (
            <Button variant="link" size="sm" asChild className="h-auto p-0 text-primary">
              <Link href={settingsHref}>{t("goToSettings")}</Link>
            </Button>
          ) : null}
        </div>
      ) : isLoading ? (
        <MediaHubCardSkeleton />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      )}
    </article>
  );
}

function MediaHubCardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-10 animate-pulse rounded-lg bg-muted/50" />
      <div className="min-h-[240px] flex-1 animate-pulse rounded-2xl bg-muted/50 sm:min-h-[280px]" />
    </div>
  );
}
