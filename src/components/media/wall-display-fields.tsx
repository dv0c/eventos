"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { PlusUpgradeBadge } from "@/components/events/settings/settings-ui";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { WallDisplaySettings, WallQrSize } from "@/server/events/wall-settings";
import { cn } from "@/lib/utils";

interface WallDisplayFieldsProps {
  eventId: string;
  settings: WallDisplaySettings;
  onChange: (next: WallDisplaySettings) => void;
  className?: string;
}

const QR_SIZES: WallQrSize[] = ["sm", "md", "lg", "xl"];

export function WallDisplayFields({
  eventId,
  settings,
  onChange,
  className,
}: WallDisplayFieldsProps) {
  const t = useTranslations("events.wallCustomization");
  const tCommon = useTranslations("common");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showOpacity, setShowOpacity] = useState(false);

  async function saveSettings(patch: Partial<WallDisplaySettings>) {
    const previous = settings;
    const next = { ...settings, ...patch };
    onChange(next);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/events/${eventId}/settings/wall`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!response.ok) {
        toast.error(t("saveError"));
        onChange(previous);
        setIsSaving(false);
        return;
      }

      const json = await response.json();
      onChange(json.data.wall);
    } catch {
      toast.error(t("saveError"));
      onChange(previous);
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

  return (
    <div className={cn("space-y-6", className)}>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{t("mediaDuration")}</h3>
          <PlusUpgradeBadge />
        </div>
        <p className="text-sm text-muted-foreground">{t("mediaDurationDescription")}</p>
        <div className="grid grid-cols-3 gap-3">
          <DurationBox
            id="imageDuration"
            label={t("imageDuration")}
            secondsLabel={t("seconds")}
            value={settings.imageDurationSec}
            onChange={(value) => void saveSettings({ imageDurationSec: value })}
            disabled={isSaving}
          />
          <DurationBox
            id="videoDuration"
            label={t("videoDuration")}
            secondsLabel={t("seconds")}
            value={settings.videoDurationSec}
            onChange={(value) => void saveSettings({ videoDurationSec: value })}
            disabled={isSaving}
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{t("automaticVideoDuration")}</p>
              <PlusUpgradeBadge />
            </div>
            <p className="text-sm text-muted-foreground">{t("playVideoFullLength")}</p>
          </div>
          <Switch
            checked={settings.playVideoFullLength}
            onCheckedChange={(checked) => void saveSettings({ playVideoFullLength: checked })}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transitionMs" className="text-sm font-semibold">
            {t("transitionSpeed")}
          </Label>
          <p className="text-sm text-muted-foreground">{t("transitionSpeedDescription")}</p>
          <div className="flex items-center gap-3">
            <input
              id="transitionMs"
              type="range"
              min={200}
              max={1200}
              step={50}
              value={settings.transitionMs}
              disabled={isSaving}
              onChange={(e) =>
                void saveSettings({ transitionMs: Number.parseInt(e.target.value, 10) })
              }
              className="w-full"
            />
            <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
              {settings.transitionMs}ms
            </span>
          </div>
        </div>
      </section>

      <section className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t("background")}</h3>
          <p className="text-sm text-muted-foreground">{t("backgroundDescription")}</p>
          {settings.backgroundUrl ? (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => void saveSettings({ backgroundUrl: null })}
                disabled={isSaving}
              >
                {t("removeBackground")}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowOpacity((v) => !v)}
              >
                <Pencil className="h-3 w-3" />
                {t("editOpacity")}
              </button>
            </div>
          ) : null}
          {showOpacity && settings.backgroundUrl ? (
            <input
              type="range"
              min={0}
              max={100}
              value={settings.backgroundOpacity ?? 100}
              disabled={isSaving}
              onChange={(e) =>
                void saveSettings({ backgroundOpacity: Number.parseInt(e.target.value, 10) })
              }
              className="mt-2 w-40"
            />
          ) : null}
        </div>
        <Label className="cursor-pointer shrink-0">
          <div
            className={cn(
              "relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/30 text-sm text-muted-foreground",
              isUploading && "opacity-60",
            )}
          >
            {settings.backgroundUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.backgroundUrl}
                alt=""
                className="h-full w-full object-cover"
                style={{ opacity: (settings.backgroundOpacity ?? 100) / 100 }}
              />
            ) : (
              <span>{isUploading ? tCommon("loading") : t("upload")}</span>
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleBackgroundUpload(file);
            }}
          />
        </Label>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">{t("qrSize")}</Label>
          <p className="text-sm text-muted-foreground">{t("qrSizeDescription")}</p>
          <div className="flex flex-wrap gap-2">
            {QR_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                disabled={isSaving}
                onClick={() => void saveSettings({ qrSize: size })}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium uppercase transition",
                  settings.qrSize === size
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/40",
                )}
              >
                {t(
                  size === "sm"
                    ? "qrSizeSm"
                    : size === "md"
                      ? "qrSizeMd"
                      : size === "lg"
                        ? "qrSizeLg"
                        : "qrSizeXl",
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marqueeText" className="text-sm font-semibold">
            {t("marqueeText")}
          </Label>
          <p className="text-sm text-muted-foreground">{t("marqueeTextDescription")}</p>
          <textarea
            id="marqueeText"
            rows={2}
            value={settings.marqueeText}
            disabled={isSaving}
            placeholder={t("marqueeTextPlaceholder")}
            onBlur={(e) => {
              if (e.target.value !== settings.marqueeText) {
                void saveSettings({ marqueeText: e.target.value });
              }
            }}
            onChange={(e) => onChange({ ...settings, marqueeText: e.target.value })}
            className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="marqueeSpeed" className="text-sm font-semibold">
            {t("marqueeSpeed")}
          </Label>
          <div className="flex items-center gap-3">
            <input
              id="marqueeSpeed"
              type="range"
              min={10}
              max={120}
              step={5}
              value={settings.marqueeSpeed}
              disabled={isSaving}
              onChange={(e) =>
                void saveSettings({ marqueeSpeed: Number.parseInt(e.target.value, 10) })
              }
              className="w-full"
            />
            <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
              {settings.marqueeSpeed}s
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SwitchToggleRow
          title={t("hideSideImages")}
          description={t("hideSideImagesDescription")}
          checked={settings.hideSideImages}
          onChange={(checked) => void saveSettings({ hideSideImages: checked })}
          disabled={isSaving}
        />
        <SwitchToggleRow
          title={t("hideQrCode")}
          description={t("hideQrCodeDescription")}
          checked={settings.hideQrCode}
          onChange={(checked) => void saveSettings({ hideQrCode: checked })}
          disabled={isSaving}
        />
        <SwitchToggleRow
          title={t("hideNickname")}
          description={t("hideNicknameDescription")}
          checked={settings.hideNickname}
          onChange={(checked) => void saveSettings({ hideNickname: checked })}
          disabled={isSaving}
        />
        <SwitchToggleRow
          title={t("hideCaption")}
          description={t("hideCaptionDescription")}
          checked={settings.hideCaption}
          onChange={(checked) => void saveSettings({ hideCaption: checked })}
          disabled={isSaving}
        />
        <SwitchToggleRow
          title={t("hideLikes")}
          description={t("hideLikesDescription")}
          checked={settings.hideLikes}
          onChange={(checked) => void saveSettings({ hideLikes: checked })}
          disabled={isSaving}
        />
        <SwitchToggleRow
          title={t("hideMarquee")}
          description={t("hideMarqueeDescription")}
          checked={settings.hideMarquee}
          onChange={(checked) => void saveSettings({ hideMarquee: checked })}
          disabled={isSaving}
        />
      </section>
    </div>
  );
}

function DurationBox({
  id,
  label,
  secondsLabel,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  secondsLabel: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <input
        id={id}
        type="number"
        min={1}
        max={300}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10) || 1)}
        className="h-10 w-full rounded-md border border-border bg-muted/30 text-center text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      />
      <span className="text-[10px] text-muted-foreground">{secondsLabel}</span>
    </div>
  );
}

function SwitchToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
