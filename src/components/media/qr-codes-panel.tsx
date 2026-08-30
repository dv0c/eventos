"use client";

import type { QRCodeType } from "@prisma/client";
import { Download, QrCode, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QrCodeItem {
  id: string;
  type: QRCodeType;
  url: string;
  storageKey: string | null;
  downloadUrl: string | null;
}

interface QrCodesPanelProps {
  eventId: string;
}

const QR_TYPE_KEYS: Record<QRCodeType, string> = {
  EVENT: "event",
  RSVP: "rsvp",
  UPLOAD: "upload",
  WALL: "wall",
};

export function QrCodesPanel({ eventId }: QrCodesPanelProps) {
  const t = useTranslations("media");
  const [qrCodes, setQrCodes] = useState<QrCodeItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadQrCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/qr`);
      if (response.ok) {
        const json = await response.json();
        setQrCodes(json.data.qrCodes);
      }
    } catch {
      toast.error(t("qrLoadError"));
    }
    setIsLoading(false);
  }, [eventId, t]);

  useEffect(() => {
    void loadQrCodes();
  }, [loadQrCodes]);

  async function generateAll() {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/events/${eventId}/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        toast.error(t("qrGenerateError"));
        setIsGenerating(false);
        return;
      }

      const json = await response.json();
      setQrCodes(json.data.qrCodes);
      toast.success(t("qrGenerateSuccess"));
    } catch {
      toast.error(t("qrGenerateError"));
    }
    setIsGenerating(false);
  }

  return (
    <Card className="surface-elevated max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          {t("qrCodes")}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          disabled={isGenerating}
          onClick={generateAll}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
          {t("generateQr")}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loadingQr")}</p>
        ) : (
          <ul className="divide-y">
            {qrCodes.map((code) => (
              <li
                key={code.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {t(`qrType.${QR_TYPE_KEYS[code.type]}` as "qrType.event")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">
                    {code.url}
                  </p>
                </div>
                {code.downloadUrl ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={code.downloadUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      {t("downloadQr")}
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("qrNotGenerated")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
