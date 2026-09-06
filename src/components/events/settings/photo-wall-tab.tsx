"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PhotoWallTabSkeleton } from "@/components/dashboard/org-skeletons";
import { WallDisplayFields } from "@/components/media/wall-display-fields";
import type { WallDisplaySettings } from "@/server/events/wall-settings";
import { getWallSettingsFromSections } from "@/server/events/wall-settings";
import type { EventWithRelations } from "@/server/repositories/event.repository";

export function PhotoWallTab({ event }: { event: EventWithRelations }) {
  const t = useTranslations("eventWorkspace.settings");
  const [settings, setSettings] = useState<WallDisplaySettings | null>(() =>
    event.settings?.sections
      ? getWallSettingsFromSections(event.settings.sections)
      : null,
  );
  const [isLoading, setIsLoading] = useState(!settings);

  useEffect(() => {
    if (settings) return;
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/events/${event.id}/settings/wall`);
        if (!response.ok) {
          toast.error(t("saveFailed"));
          return;
        }
        const json = await response.json();
        if (!cancelled) setSettings(json.data.wall);
      } catch {
        if (!cancelled) toast.error(t("saveFailed"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event.id, settings, t]);

  if (isLoading || !settings) {
    return <PhotoWallTabSkeleton />;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-semibold">{t("photoWallTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("photoWallDesc")}</p>
      </div>
      <WallDisplayFields
        eventId={event.id}
        settings={settings}
        onChange={setSettings}
      />
    </div>
  );
}
