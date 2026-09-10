"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { THEME_PRESETS } from "@/components/events/wizard/event-type-config";
import type { WizardFormData } from "@/components/events/wizard/wizard-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ThemeStepProps {
  form: UseFormReturn<WizardFormData>;
  coverPreview: string | null;
  onOpenCoverUpload: () => void;
}

export function ThemeStep({
  form,
  coverPreview,
  onOpenCoverUpload,
}: ThemeStepProps) {
  const t = useTranslations("wizard");
  const values = form.watch();
  const [showCustom, setShowCustom] = useState(false);

  function applyPreset(preset: (typeof THEME_PRESETS)[number]) {
    form.setValue("primaryColor", preset.primaryColor, { shouldDirty: true });
    form.setValue("secondaryColor", preset.secondaryColor, { shouldDirty: true });
    form.setValue("accentColor", preset.accentColor, { shouldDirty: true });
    form.setValue("style", preset.style, { shouldDirty: true });
  }

  const activePresetId =
    THEME_PRESETS.find(
      (preset) =>
        preset.primaryColor === values.primaryColor &&
        preset.secondaryColor === values.secondaryColor &&
        preset.accentColor === values.accentColor,
    )?.id ?? null;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base">{t("choosePalette")}</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:border-primary/40",
                activePresetId === preset.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border/60",
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
                {t(preset.nameKey as "presets.elegantPurple")}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base">{t("coverImage")}</Label>
        <Button type="button" variant="outline" className="h-12 w-full" onClick={onOpenCoverUpload}>
          {t("coverImage")}
        </Button>
        {coverPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPreview}
            alt={t("coverPreview")}
            className="h-36 w-full rounded-2xl object-cover shadow-sm"
          />
        ) : null}
      </div>

      <div
        className="overflow-hidden rounded-2xl p-8 text-center shadow-md"
        style={{
          background: `linear-gradient(135deg, ${values.primaryColor}, ${values.secondaryColor})`,
        }}
      >
        <p className="text-xl font-semibold text-white">
          {values.name || t("preview")}
        </p>
        {values.date ? (
          <p className="mt-2 text-sm text-white/80">{values.date}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border/60">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          onClick={() => setShowCustom((prev) => !prev)}
        >
          {t("customColors")}
          {showCustom ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>

        {showCustom ? (
          <div className="space-y-4 border-t border-border/60 px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">{t("primaryColor")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    className="h-10 w-14 p-1"
                    {...form.register("primaryColor")}
                  />
                  <Input {...form.register("primaryColor")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">{t("secondaryColor")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    className="h-10 w-14 p-1"
                    {...form.register("secondaryColor")}
                  />
                  <Input {...form.register("secondaryColor")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">{t("accentColor")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    className="h-10 w-14 p-1"
                    {...form.register("accentColor")}
                  />
                  <Input {...form.register("accentColor")} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("style")}</Label>
              <Select
                value={values.style}
                onValueChange={(v) => form.setValue("style", v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elegant">{t("styleElegant")}</SelectItem>
                  <SelectItem value="modern">{t("styleModern")}</SelectItem>
                  <SelectItem value="classic">{t("styleClassic")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
