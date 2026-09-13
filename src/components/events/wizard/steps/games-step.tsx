"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { WizardFormData, WizardGameForm } from "@/components/events/wizard/wizard-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getGamePresetsForType,
  resolveGameMode,
  type EventGameMode,
  type GamePreset,
} from "@/lib/event-game-presets";
import { cn } from "@/lib/utils";

interface GamesStepProps {
  form: UseFormReturn<WizardFormData>;
}

function presetToForm(preset: GamePreset, index: number): WizardGameForm {
  return {
    title: preset.title,
    description: preset.description,
    presetKey: preset.presetKey,
    mode: resolveGameMode(preset),
    enabled: true,
    sortOrder: index,
    coverImage: preset.coverImage ?? null,
    fields: preset.fields,
  };
}

function ModeToggle({
  value,
  onChange,
  photoLabel,
  collageLabel,
}: {
  value: EventGameMode;
  onChange: (mode: EventGameMode) => void;
  photoLabel: string;
  collageLabel: string;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border/60 p-0.5">
      <button
        type="button"
        onClick={() => onChange("photo")}
        className={cn(
          "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          value === "photo"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {photoLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("collage")}
        className={cn(
          "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          value === "collage"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {collageLabel}
      </button>
    </div>
  );
}

export function GamesStep({ form }: GamesStepProps) {
  const t = useTranslations("wizard");
  const eventType = form.watch("type");
  const games = form.watch("games");

  useEffect(() => {
    const current = form.getValues("games");
    if (current.length > 0) return;
    const presets = getGamePresetsForType(eventType);
    form.setValue(
      "games",
      presets.map((preset, index) => presetToForm(preset, index)),
      { shouldDirty: false },
    );
  }, [eventType, form]);

  function resetToPresets() {
    const presets = getGamePresetsForType(eventType);
    form.setValue(
      "games",
      presets.map((preset, index) => presetToForm(preset, index)),
      { shouldDirty: true },
    );
  }

  function updateGame(index: number, patch: Partial<WizardGameForm>) {
    const next = games.map((game, i) => (i === index ? { ...game, ...patch } : game));
    form.setValue("games", next, { shouldDirty: true });
  }

  function removeGame(index: number) {
    form.setValue(
      "games",
      games.filter((_, i) => i !== index).map((game, i) => ({ ...game, sortOrder: i })),
      { shouldDirty: true },
    );
  }

  function addCustomGame() {
    form.setValue(
      "games",
      [
        ...games,
        {
          title: t("customGameDefaultTitle"),
          description: "",
          presetKey: null,
          mode: "photo" as const,
          enabled: true,
          sortOrder: games.length,
          coverImage: null,
          fields: [
            {
              id: "photo",
              type: "photo" as const,
              label: t("customGamePhotoLabel"),
              required: true,
            },
          ],
        },
      ],
      { shouldDirty: true },
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{t("gamesTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("gamesDesc")}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={resetToPresets}>
            {t("gamesResetPresets")}
          </Button>
          <Button type="button" variant="gold" size="sm" className="gap-1" onClick={addCustomGame}>
            <Plus className="h-3.5 w-3.5" />
            {t("gamesAddCustom")}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {games.map((game, index) => {
          const mode = resolveGameMode(game);
          return (
            <div
              key={`${game.presetKey ?? "custom"}-${index}`}
              className={cn(
                "rounded-2xl border border-border/60 p-4",
                !game.enabled && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="space-y-1.5">
                    <Label>{t("gameTitleLabel")}</Label>
                    <Input
                      value={game.title}
                      onChange={(e) => updateGame(index, { title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("gameDescriptionLabel")}</Label>
                    <Input
                      value={game.description ?? ""}
                      onChange={(e) => updateGame(index, { description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("gameModeLabel")}</Label>
                    <ModeToggle
                      value={mode}
                      onChange={(next) => updateGame(index, { mode: next })}
                      photoLabel={t("gameModePhoto")}
                      collageLabel={t("gameModeCollage")}
                    />
                    {mode === "collage" ? (
                      <p className="text-xs text-muted-foreground">{t("gameModeCollageHint")}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">{t("gameEnabled")}</Label>
                    <Switch
                      checked={game.enabled}
                      onCheckedChange={(checked) => updateGame(index, { enabled: checked })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGame(index)}
                    aria-label={t("gameRemove")}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {games.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            {t("gamesEmpty")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
