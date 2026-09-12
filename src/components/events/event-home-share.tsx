"use client";

import type { QRCodeType } from "@prisma/client";
import { Download, QrCode, Share2, Upload, Images } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { QrPreview, QrUrlField } from "@/components/media/qr-link-row";
import { Button } from "@/components/ui/button";
import type { EventLifecycle } from "@/server/events/event-ended";

interface QrCodeItem {
  id: string;
  type: QRCodeType;
  url: string;
  imageUrl: string;
  downloadUrl: string | null;
}

interface EventHomeShareProps {
  eventId: string;
  eventSlug: string;
  enableGallery: boolean;
  lifecycle: EventLifecycle;
}

export function EventHomeShare({
  eventId,
  enableGallery,
  lifecycle,
}: EventHomeShareProps) {
  const t = useTranslations("eventWorkspace.home");
  const tHub = useTranslations("events.mediaHub");
  const sectionId = useId();
  const [uploadCode, setUploadCode] = useState<QrCodeItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadQrCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/qr`);
      if (response.ok) {
        const json = await response.json();
        const codes = (json.data.qrCodes ?? []) as QrCodeItem[];
        setUploadCode(codes.find((c) => c.type === "UPLOAD") ?? null);
      }
    } catch {
      toast.error(tHub("loadError"));
    }
    setIsLoading(false);
  }, [eventId, tHub]);

  useEffect(() => {
    void loadQrCodes();
  }, [loadQrCodes]);

  const downloadUrl = uploadCode?.imageUrl
    ? `${uploadCode.imageUrl}&download=1`
    : uploadCode?.downloadUrl;

  async function shareLink() {
    if (!uploadCode?.url) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: t("shareTitle"),
          url: uploadCode.url,
        });
        return;
      }
      await navigator.clipboard.writeText(uploadCode.url);
      toast.success(tHub("copied"));
    } catch {
      // user cancelled share or clipboard failed
    }
  }

  return (
    <section id="share-with-guests" aria-labelledby={sectionId} className="dashboard-section">
      <div className="dashboard-surface p-5 sm:p-6">
        <div className="mb-5 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            {t("shareStepLabel")}
          </p>
          <h2 id={sectionId} className="text-lg font-semibold tracking-tight text-foreground">
            {t("shareTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {lifecycle === "ended"
              ? t("shareEndedSubtitle")
              : lifecycle === "waiting"
                ? t("shareWaitingReadySubtitle")
                : t("shareSubtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            {isLoading ? (
              <div className="h-40 w-40 animate-pulse rounded-xl bg-muted" />
            ) : (
              <QrPreview
                imageUrl={uploadCode?.imageUrl || null}
                downloadUrl={downloadUrl}
                alt={t("shareTitle")}
                className="h-40 w-40 border border-border/60 bg-white p-2 shadow-sm"
              />
            )}
            {!enableGallery ? (
              <p className="max-w-[12rem] text-center text-xs text-muted-foreground sm:text-left">
                {tHub("galleryDisabled")}
              </p>
            ) : null}
          </div>

          <div className="min-w-0 space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{t("shareUrlLabel")}</p>
              {isLoading || !uploadCode ? (
                <div className="h-10 animate-pulse rounded-lg bg-muted" />
              ) : (
                <QrUrlField url={uploadCode.url} disabled={!enableGallery} />
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="h-9"
                disabled={!uploadCode || !enableGallery}
                onClick={shareLink}
              >
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                {t("shareButton")}
              </Button>
              {downloadUrl ? (
                <Button variant="outline" size="sm" className="h-9 bg-background" asChild>
                  <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    {tHub("downloadQr")}
                  </a>
                </Button>
              ) : null}
              <Button variant="outline" size="sm" className="h-9 bg-background" asChild>
                <a
                  href={uploadCode?.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("openAlbum")}
                </a>
              </Button>
            </div>

            <ol className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: QrCode, label: t("stepScan") },
                { icon: Upload, label: t("stepUpload") },
                { icon: Images, label: t("stepAppear") },
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.label}
                    className="flex items-start gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background text-primary shadow-sm">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("stepNumber", { n: index + 1 })}
                      </p>
                      <p className="text-sm font-medium text-foreground">{step.label}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
