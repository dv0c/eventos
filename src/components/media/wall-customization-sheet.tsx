"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { WallDisplayFields } from "@/components/media/wall-display-fields";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { WallDisplaySettings } from "@/server/events/wall-settings";

interface WallCustomizationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  initialSettings?: WallDisplaySettings;
  onSaved?: (settings: WallDisplaySettings) => void;
  settingsHref?: string;
  upgradeHref?: string;
}

export function WallCustomizationSheet({
  open,
  onOpenChange,
  eventId,
  initialSettings,
  onSaved,
  settingsHref,
}: WallCustomizationSheetProps) {
  const t = useTranslations("events.wallCustomization");
  const tCommon = useTranslations("common");
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [settings, setSettings] = useState<WallDisplaySettings | null>(
    initialSettings ?? null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/settings/wall`);
      if (response.ok) {
        const json = await response.json();
        setSettings(json.data.wall);
      }
    } catch {
      toast.error(t("loadError"));
    }
    setIsLoading(false);
  }, [eventId, t]);

  useEffect(() => {
    if (open && !initialSettings) {
      void loadSettings();
    } else if (open && initialSettings) {
      setSettings(initialSettings);
    }
  }, [open, initialSettings, loadSettings]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        showCloseButton={false}
        className={cn(
          "flex w-full flex-col gap-0 p-0",
          isDesktop
            ? "sm:max-w-md"
            : "max-h-[85dvh] rounded-t-2xl",
        )}
      >
        <div className="flex shrink-0 items-center gap-3 border-b px-5 py-4">
          <SheetClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
          <SheetTitle className="text-lg font-semibold">{t("title")}</SheetTitle>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-8">
          {isLoading || !settings ? (
            <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                {t("settingsHintBefore")}{" "}
                {settingsHref ? (
                  <Link href={settingsHref} className="font-medium text-primary hover:underline">
                    {t("eventSettingsLink")}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{t("eventSettingsLink")}</span>
                )}{" "}
                {t("settingsHintAfter")}
              </p>
              <WallDisplayFields
                eventId={eventId}
                settings={settings}
                onChange={(next) => {
                  setSettings(next);
                  onSaved?.(next);
                }}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { DisplayOnIcons } from "@/components/media/display-on-icons";
