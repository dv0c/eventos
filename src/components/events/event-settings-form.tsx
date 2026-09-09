"use client";

import {
  Gamepad2,
  MonitorPlay,
  Palette,
  Settings2,
  Shield,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppearanceTab } from "@/components/events/settings/appearance-tab";
import { CollaboratorsTab } from "@/components/events/settings/collaborators-tab";
import { GamesTab } from "@/components/events/settings/games-tab";
import { GeneralTab } from "@/components/events/settings/general-tab";
import { ModerationTab } from "@/components/events/settings/moderation-tab";
import { PhotoWallTab } from "@/components/events/settings/photo-wall-tab";
import { cn } from "@/lib/utils";
import type { EventWithRelations } from "@/server/repositories/event.repository";

type SettingsTab =
  | "general"
  | "appearance"
  | "photoWall"
  | "moderation"
  | "games"
  | "collaborators";

const VALID_TABS: SettingsTab[] = [
  "general",
  "appearance",
  "photoWall",
  "moderation",
  "games",
  "collaborators",
];

interface EventSettingsFormProps {
  event: EventWithRelations;
  orgSlug: string;
  initialTab?: SettingsTab;
}

function resolveTab(value: string | null | undefined, fallback: SettingsTab): SettingsTab {
  if (value && VALID_TABS.includes(value as SettingsTab)) {
    return value as SettingsTab;
  }
  return fallback;
}

export function EventSettingsForm({
  event,
  orgSlug,
  initialTab = "general",
}: EventSettingsFormProps) {
  const t = useTranslations("eventWorkspace.settings");
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SettingsTab>(() =>
    resolveTab(searchParams.get("tab"), initialTab),
  );

  useEffect(() => {
    setTab(resolveTab(searchParams.get("tab"), initialTab));
  }, [searchParams, initialTab]);

  const tabs = useMemo(
    () =>
      [
        { id: "general" as const, label: t("tabGeneral"), icon: Settings2 },
        { id: "appearance" as const, label: t("tabAppearance"), icon: Palette },
        { id: "photoWall" as const, label: t("tabPhotoWall"), icon: MonitorPlay },
        { id: "moderation" as const, label: t("tabModeration"), icon: Shield },
        { id: "games" as const, label: t("tabGames"), icon: Gamepad2 },
        { id: "collaborators" as const, label: t("tabCollaborators"), icon: UsersRound },
      ] as const,
    [t],
  );

  function selectTab(next: SettingsTab) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "general") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", next);
    }
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {t("title")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-border/50">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className={tab === "photoWall" ? undefined : "max-w-2xl"}>
        {tab === "general" ? <GeneralTab event={event} orgSlug={orgSlug} /> : null}
        {tab === "appearance" ? <AppearanceTab event={event} /> : null}
        {tab === "photoWall" ? <PhotoWallTab event={event} /> : null}
        {tab === "moderation" ? (
          <ModerationTab
            event={event}
            onManageCollaborators={() => selectTab("collaborators")}
          />
        ) : null}
        {tab === "games" ? <GamesTab event={event} /> : null}
        {tab === "collaborators" ? <CollaboratorsTab event={event} /> : null}
      </div>
    </div>
  );
}
