"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { THEME_PRESETS } from "@/components/events/wizard/event-type-config";
import { EVENTOS_DEFAULT_THEME } from "@/components/events/event-theme-scope";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface ThemeStudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ThemeColors;
  saving?: boolean;
  onSave: (colors: ThemeColors) => void | Promise<void>;
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-border bg-transparent"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 font-mono text-sm"
        />
      </div>
    </div>
  );
}

export function ThemeStudioDialog({
  open,
  onOpenChange,
  value,
  saving,
  onSave,
}: ThemeStudioDialogProps) {
  const t = useTranslations("eventWorkspace.settings");
  const tWizard = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const [draft, setDraft] = useState<ThemeColors>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const activePresetId = useMemo(
    () =>
      THEME_PRESETS.find(
        (preset) =>
          preset.primaryColor === draft.primaryColor &&
          preset.secondaryColor === draft.secondaryColor &&
          preset.accentColor === draft.accentColor,
      )?.id ?? null,
    [draft],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("themeStudioTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("themeStudioPresetsHint")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    setDraft({
                      primaryColor: preset.primaryColor,
                      secondaryColor: preset.secondaryColor,
                      accentColor: preset.accentColor,
                    })
                  }
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary/40",
                    activePresetId === preset.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border/60 dark:border-white/10",
                  )}
                >
                  <div className="flex -space-x-1">
                    <span
                      className="size-6 rounded-full border border-white/80"
                      style={{ backgroundColor: preset.primaryColor }}
                    />
                    <span
                      className="size-6 rounded-full border border-white/80"
                      style={{ backgroundColor: preset.secondaryColor }}
                    />
                    <span
                      className="size-6 rounded-full border border-white/80"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {tWizard(preset.nameKey as "presets.elegantPurple")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <ColorField
              id="theme-primary"
              label={t("primaryColor")}
              value={draft.primaryColor}
              onChange={(primaryColor) => setDraft((d) => ({ ...d, primaryColor }))}
            />
            <ColorField
              id="theme-secondary"
              label={t("secondaryColor")}
              value={draft.secondaryColor}
              onChange={(secondaryColor) => setDraft((d) => ({ ...d, secondaryColor }))}
            />
            <ColorField
              id="theme-accent"
              label={t("accentColor")}
              value={draft.accentColor}
              onChange={(accentColor) => setDraft((d) => ({ ...d, accentColor }))}
            />
          </div>

          <div
            className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5"
            style={
              {
                "--primary": draft.primaryColor,
                "--ring": draft.primaryColor,
                "--accent": draft.accentColor,
                "--event-secondary": draft.secondaryColor,
              } as CSSProperties
            }
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("themeStudioPreview")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="default" className="pointer-events-none">
                {t("themePreviewPrimaryBtn")}
              </Button>
              <Button type="button" variant="gold" className="pointer-events-none">
                {t("themePreviewGoldBtn")}
              </Button>
              <Button type="button" variant="outline" className="pointer-events-none">
                {t("themePreviewOutlineBtn")}
              </Button>
            </div>
            <Input
              readOnly
              value={t("themePreviewInput")}
              className="pointer-events-none h-10 border-primary/50 focus-visible:ring-primary"
            />
            <div className="flex flex-wrap gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: draft.primaryColor }}
              >
                {t("themePreviewPrimaryChip")}
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium text-black"
                style={{ backgroundColor: draft.secondaryColor }}
              >
                {t("themePreviewSecondaryChip")}
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium text-black"
                style={{ backgroundColor: draft.accentColor }}
              >
                {t("themePreviewAccentChip")}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white/10"
              aria-hidden
            >
              <div
                className="h-full w-2/3 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${draft.primaryColor}, ${draft.accentColor})`,
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            className="sm:mr-auto"
            onClick={() =>
              setDraft({
                primaryColor: EVENTOS_DEFAULT_THEME.primaryColor,
                secondaryColor: EVENTOS_DEFAULT_THEME.secondaryColor,
                accentColor: EVENTOS_DEFAULT_THEME.accentColor,
              })
            }
          >
            {t("themeStudioResetDefault")}
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="gold"
              disabled={saving}
              onClick={() => void onSave(draft)}
            >
              {tCommon("save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
