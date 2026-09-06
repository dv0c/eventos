"use client";

import { Copy, Download, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface QrLinkRowProps {
  url: string;
  openHref: string;
  openExternal?: boolean;
  downloadUrl?: string | null;
  disabled?: boolean;
}

export function QrUrlField({
  url,
  disabled = false,
}: {
  url: string;
  disabled?: boolean;
}) {
  const t = useTranslations("events.mediaHub");

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <div className="relative w-full min-w-0">
      <Input
        readOnly
        value={url}
        className="h-10 border-border/60 bg-background pr-10 font-mono text-xs"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-primary hover:bg-primary/10 hover:text-primary"
        onClick={copyUrl}
        disabled={disabled}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function QrActions({
  openHref,
  openExternal = false,
  downloadUrl,
  disabled = false,
  className,
  hideOpen = false,
}: {
  openHref: string;
  openExternal?: boolean;
  downloadUrl?: string | null;
  disabled?: boolean;
  className?: string;
  hideOpen?: boolean;
}) {
  const t = useTranslations("events.mediaHub");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {!hideOpen ? (
        openExternal ? (
          <Button asChild variant="default" className="h-9 w-full sm:w-auto" disabled={disabled}>
            <a href={openHref} target="_blank" rel="noopener noreferrer">
              {t("open")}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        ) : (
          <Button asChild variant="default" className="h-9 w-full sm:w-auto" disabled={disabled}>
            <Link href={openHref} target="_blank">
              {t("open")}
            </Link>
          </Button>
        )
      ) : null}
      {downloadUrl ? (
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-full bg-popover sm:w-auto"
          asChild
          disabled={disabled}
        >
          <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            {t("downloadQr")}
          </a>
        </Button>
      ) : null}
    </div>
  );
}

/** @deprecated Prefer QrUrlField + QrActions for new layouts */
export function QrLinkRow({
  url,
  openHref,
  openExternal = false,
  downloadUrl,
  disabled = false,
}: QrLinkRowProps) {
  return (
    <div className="space-y-3">
      <QrUrlField url={url} disabled={disabled} />
      <QrActions
        openHref={openHref}
        openExternal={openExternal}
        downloadUrl={downloadUrl}
        disabled={disabled}
        className="flex-row flex-wrap"
      />
    </div>
  );
}

interface QrPreviewProps {
  imageUrl?: string | null;
  downloadUrl?: string | null;
  alt: string;
  className?: string;
}

export function QrPreview({ imageUrl, downloadUrl, alt, className }: QrPreviewProps) {
  const t = useTranslations("events.mediaHub");
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const src = imageUrl ?? downloadUrl ?? null;

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-background p-3 text-center text-xs text-muted-foreground",
          className,
        )}
      >
        <span>{hasError ? t("qrPreviewError") : "QR"}</span>
        {hasError && src ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 bg-popover px-2 text-[10px]"
            onClick={() => {
              setHasError(false);
              setRetryKey((value) => value + 1);
            }}
          >
            {t("retryQr")}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={retryKey}
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn(
        "h-32 w-32 rounded-xl border-2 border-primary/40 bg-background object-contain p-2",
        className,
      )}
    />
  );
}
