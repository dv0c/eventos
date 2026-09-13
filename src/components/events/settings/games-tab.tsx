"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getGamePresetsForType,
  resolveGameMode,
  type EventGameMode,
} from "@/lib/event-game-presets";
import { cn } from "@/lib/utils";
import type { EventWithRelations } from "@/server/repositories/event.repository";

type GameDraft = {
  id?: string;
  title: string;
  description: string;
  presetKey: string | null;
  mode: EventGameMode;
  enabled: boolean;
  sortOrder: number;
  coverImage: string | null;
  fields: unknown;
};

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

export function GamesTab({ event }: { event: EventWithRelations }) {
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const [games, setGames] = useState<GameDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/events/${event.id}/games`);
        const json = await response.json();
        if (!response.ok) throw new Error("load failed");
        if (cancelled) return;
        const rows = (json.data?.games ?? []) as Array<{
          id: string;
          title: string;
          description: string | null;
          presetKey: string | null;
          mode?: string | null;
          enabled: boolean;
          sortOrder: number;
          coverImage: string | null;
          fields: unknown;
        }>;
        setGames(
          rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description ?? "",
            presetKey: row.presetKey,
            mode: resolveGameMode(row),
            enabled: row.enabled,
            sortOrder: row.sortOrder,
            coverImage: row.coverImage,
            fields: row.fields,
          })),
        );
      } catch {
        if (!cancelled) toast.error(t("gamesLoadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [event.id, t]);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/events/${event.id}/games`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          games: games.map((game, index) => ({
            ...game,
            sortOrder: index,
            description: game.description || null,
          })),
        }),
      });
      if (!response.ok) {
        toast.error(t("gamesSaveFailed"));
        return;
      }
      toast.success(tCommon("save"));
    } catch {
      toast.error(t("gamesSaveFailed"));
    } finally {
      setSaving(false);
    }
  }

  function resetPresets() {
    const presets = getGamePresetsForType(event.type);
    setGames(
      presets.map((preset, index) => ({
        title: preset.title,
        description: preset.description,
        presetKey: preset.presetKey,
        mode: resolveGameMode(preset),
        enabled: true,
        sortOrder: index,
        coverImage: preset.coverImage ?? null,
        fields: preset.fields,
      })),
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{t("gamesTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("gamesDesc")}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={resetPresets}>
            {t("gamesResetPresets")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() =>
              setGames((prev) => [
                ...prev,
                {
                  title: t("customGameDefaultTitle"),
                  description: "",
                  presetKey: null,
                  mode: "photo",
                  enabled: true,
                  sortOrder: prev.length,
                  coverImage: null,
                  fields: [
                    {
                      id: "photo",
                      type: "photo",
                      label: t("customGamePhotoLabel"),
                      required: true,
                    },
                  ],
                },
              ])
            }
          >
            <Plus className="h-3.5 w-3.5" />
            {t("gamesAddCustom")}
          </Button>
          <Button type="button" variant="gold" size="sm" disabled={saving} onClick={() => void save()}>
            {tCommon("save")}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {games.map((game, index) => (
          <div key={`${game.id ?? "new"}-${index}`} className="rounded-2xl border border-border/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-1.5">
                  <Label>{t("gameTitleLabel")}</Label>
                  <Input
                    value={game.title}
                    onChange={(e) =>
                      setGames((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, title: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("gameDescriptionLabel")}</Label>
                  <Input
                    value={game.description}
                    onChange={(e) =>
                      setGames((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, description: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("gameModeLabel")}</Label>
                  <ModeToggle
                    value={game.mode}
                    onChange={(mode) =>
                      setGames((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, mode } : row)),
                      )
                    }
                    photoLabel={t("gameModePhoto")}
                    collageLabel={t("gameModeCollage")}
                  />
                  {game.mode === "collage" ? (
                    <p className="text-xs text-muted-foreground">{t("gameModeCollageHint")}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{t("gameEnabled")}</Label>
                  <Switch
                    checked={game.enabled}
                    onCheckedChange={(checked) =>
                      setGames((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, enabled: checked } : row,
                        ),
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setGames((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
