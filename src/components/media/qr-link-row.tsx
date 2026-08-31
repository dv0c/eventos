"use client";

import { Copy, Download, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

interface QrLinkRowProps {
  url: string;
  openHref: string;
  openExternal?: boolean;
  downloadUrl?: string | null;
  disabled?: boolean;
}

export function QrLinkRow({
  url,
  openHref,
  openExternal = false,
  downloadUrl,
  disabled = false,
}: QrLinkRowProps) {
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Input
          readOnly
          value={url}
          className="bg-white pr-10 font-mono text-xs"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-primary"
          onClick={copyUrl}
          disabled={disabled}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      {openExternal ? (
        <Button asChild variant="gold" disabled={disabled}>
          <a href={openHref} target="_blank" rel="noopener noreferrer">
            {t("open")}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      ) : (
        <Button asChild variant="gold" disabled={disabled}>
          <Link href={openHref} target="_blank">
            {t("open")}
          </Link>
        </Button>
      )}
      {downloadUrl ? (
        <Button variant="outline" size="sm" asChild disabled={disabled}>
          <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            {t("downloadQr")}
          </a>
        </Button>
      ) : null}
    </div>
  );
}

interface QrPreviewProps {
  downloadUrl?: string | null;
  alt: string;
}

export function QrPreview({ downloadUrl, alt }: QrPreviewProps) {
  if (!downloadUrl) {
    return (
      <div className="flex h-36 w-36 items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-white/80 text-xs text-muted-foreground">
        QR
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={downloadUrl}
      alt={alt}
      className="h-36 w-36 rounded-xl border-2 border-primary/20 bg-white object-contain p-2"
    />
  );
}
