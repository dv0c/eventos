"use client";

import { Monitor, Projector, Tv } from "lucide-react";
import { useTranslations } from "next-intl";

export function DisplayOnIcons() {
  const t = useTranslations("events.mediaHub");
  const icons = [
    { Icon: Projector, label: t("displayProjector") },
    { Icon: Tv, label: t("displayTv") },
    { Icon: Monitor, label: t("displayLaptop") },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">{t("displayOn")}</span>
      <div className="flex items-center gap-2">
        {icons.map(({ Icon, label }) => (
          <span
            key={label}
            title={label}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary"
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        ))}
      </div>
    </div>
  );
}
