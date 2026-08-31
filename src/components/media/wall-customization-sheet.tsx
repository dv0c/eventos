"use client";

import { Monitor, Projector, Tv, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WallDisplaySettings } from "@/server/events/wall-settings";
import { cn } from "@/lib/utils";

interface WallCustomizationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  initialSettings?: WallDisplaySettings;
  onSaved?: (settings: WallDisplaySettings) => void;
}

export function WallCustomizationSheet({
  open,
  onOpenChange,
  eventId,
  initialSettings,
  onSaved,
}: WallCustomizationSheetProps) {
  const t = useTranslations("events.wallCustomization");
  const tCommon = useTranslations("common");
  const [settings, setSettings] = useState<WallDisplaySettings | null>(initialSettings ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  async function saveSettings(patch: Partial<WallDisplaySettings>) {
    if (!settings) return;

    const next = { ...settings, ...patch };
    setSettings(next);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/events/${eventId}/settings/wall`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!response.ok) {
        toast.error(t("saveError"));
        setSettings(settings);
        setIsSaving(false);
        return;
      }

      const json = await response.json();
      setSettings(json.data.wall);
      onSaved?.(json.data.wall);
      toast.success(tCommon("save"));
    } catch {
      toast.error(t("saveError"));
      setSettings(settings);
    }

    setIsSaving(false);
  }

  async function handleBackgroundUpload(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "wall-backgrounds");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        toast.error(t("uploadError"));
        setIsUploading(false);
        return;
      }

      const uploadJson = await uploadResponse.json();
      await saveSettings({ backgroundUrl: uploadJson.data.url as string });
    } catch {
      toast.error(t("uploadError"));
    }
    setIsUploading(false);
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl",
          "animate-in slide-in-from-right duration-200",
        )}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading || !settings ? (
            <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">{t("settingsHint")}</p>

              <section className="space-y-3">
                <h3 className="text-sm font-medium">{t("durations")}</h3>
                <div className="grid grid-cols-3 gap-3">
                  <DurationField
                    id="imageDuration"
                    label={t("imageDuration")}
                    value={settings.imageDurationSec}
                    onChange={(value) => void saveSettings({ imageDurationSec: value })}
                    disabled={isSaving}
                  />
                  <DurationField
                    id="videoDuration"
                    label={t("videoDuration")}
                    value={settings.videoDurationSec}
                    onChange={(value) => void saveSettings({ videoDurationSec: value })}
                    disabled={isSaving}
                  />
                  <DurationField
                    id="textDuration"
                    label={t("textDuration")}
                    value={settings.textDurationSec}
                    onChange={(value) => void saveSettings({ textDurationSec: value })}
                    disabled={isSaving}
                  />
                </div>
              </section>

              <ToggleRow
                id="playVideoFullLength"
                label={t("playVideoFullLength")}
                checked={settings.playVideoFullLength}
                onChange={(checked) => void saveSettings({ playVideoFullLength: checked })}
                disabled={isSaving}
              />

              <section className="space-y-3">
                <h3 className="text-sm font-medium">{t("background")}</h3>
                {settings.backgroundUrl ? (
                  <div className="relative h-24 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={settings.backgroundUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <Label htmlFor="backgroundUpload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={isUploading}>
                    <span>{isUploading ? tCommon("loading") : t("uploadBackground")}</span>
                  </Button>
                </Label>
                <input
                  id="backgroundUpload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleBackgroundUpload(file);
                  }}
                />
                {settings.backgroundUrl ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void saveSettings({ backgroundUrl: null })}
                    disabled={isSaving}
                  >
                    {t("removeBackground")}
                  </Button>
                ) : null}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-medium">{t("displayOptions")}</h3>
                <ToggleRow
                  id="hideSideImages"
                  label={t("hideSideImages")}
                  checked={settings.hideSideImages}
                  onChange={(checked) => void saveSettings({ hideSideImages: checked })}
                  disabled={isSaving}
                />
                <ToggleRow
                  id="hideQrCode"
                  label={t("hideQrCode")}
                  checked={settings.hideQrCode}
                  onChange={(checked) => void saveSettings({ hideQrCode: checked })}
                  disabled={isSaving}
                />
                <ToggleRow
                  id="hideCaption"
                  label={t("hideCaption")}
                  checked={settings.hideCaption}
                  onChange={(checked) => void saveSettings({ hideCaption: checked })}
                  disabled={isSaving}
                />
                <ToggleRow
                  id="hideLikes"
                  label={t("hideLikes")}
                  checked={settings.hideLikes}
                  onChange={(checked) => void saveSettings({ hideLikes: checked })}
                  disabled={isSaving}
                />
              </section>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function DurationField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={1}
        max={300}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10) || 1)}
        className="h-9"
      />
    </div>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        disabled={disabled}
      />
      <Label htmlFor={id} className="cursor-pointer text-sm">
        {label}
      </Label>
    </div>
  );
}

export function DisplayOnIcons() {
  const t = useTranslations("events.mediaHub");
  const icons = [
    { Icon: Projector, label: t("displayProjector") },
    { Icon: Tv, label: t("displayTv") },
    { Icon: Monitor, label: t("displayLaptop") },
  ];

  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-muted-foreground">{t("displayOn")}</span>
      {icons.map(({ Icon, label }) => (
        <div key={label} className="flex flex-col items-center gap-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white/80">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
