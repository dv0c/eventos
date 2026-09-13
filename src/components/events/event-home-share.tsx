"use client";

import type { QRCodeType } from "@prisma/client";
import { Download, QrCode, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { QrPreview, QrUrlField } from "@/components/media/qr-link-row";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [qrOpen, setQrOpen] = useState(false);

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

  const subtitle =
    lifecycle === "ended"
      ? t("shareEndedSubtitle")
      : lifecycle === "waiting"
        ? t("shareWaitingReadySubtitle")
        : t("shareSubtitle");

  return (
    <section id="share-with-guests" aria-labelledby={sectionId} className="space-y-3">
      <div className="space-y-1">
        <h2 id={sectionId} className="text-sm font-semibold tracking-tight text-foreground">
          {t("shareTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 bg-background"
            disabled={!uploadCode || !enableGallery}
            onClick={() => setQrOpen(true)}
          >
            <QrCode className="mr-1.5 h-3.5 w-3.5" />
            {t("showQr")}
          </Button>
        </div>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("qrDialogTitle")}</DialogTitle>
            <DialogDescription>{t("qrDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <QrPreview
              imageUrl={uploadCode?.imageUrl || null}
              downloadUrl={downloadUrl}
              alt={t("shareTitle")}
              className="h-48 w-48 border border-border/60 bg-white p-2 shadow-sm"
            />
            {downloadUrl ? (
              <Button variant="outline" size="sm" className="h-9 bg-background" asChild>
                <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {tHub("downloadQr")}
                </a>
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
