"use client";

import { useTranslations } from "next-intl";

interface EventHomeActivityProps {
  totalMedia: number;
  guestCount: number;
  mediaToday: number;
  pendingMedia: number;
}

export function EventHomeActivity({
  totalMedia,
  guestCount,
  mediaToday,
  pendingMedia,
}: EventHomeActivityProps) {
  const t = useTranslations("eventWorkspace.home");

  const stats = [
    { value: totalMedia, label: t("statMedia") },
    { value: guestCount, label: t("statGuests") },
    { value: mediaToday, label: t("statNewToday") },
    { value: pendingMedia, label: t("statPending") },
  ];

  return (
    <section className="dashboard-section" aria-label={t("activityLabel")}>
      <div className="flex flex-wrap gap-x-10 gap-y-4 border-y border-border/50 py-4">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-[5.5rem]">
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
