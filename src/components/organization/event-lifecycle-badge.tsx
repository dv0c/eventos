"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { EventLifecycle } from "@/server/events/event-ended";
import { cn } from "@/lib/utils";

const LIFECYCLE_CLASS: Record<EventLifecycle, string> = {
  waiting:
    "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/5",
  active:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/10",
  ended: "border-white/10 bg-transparent text-muted-foreground hover:bg-transparent",
};

export function EventLifecycleBadge({
  lifecycle,
  className,
}: {
  lifecycle: EventLifecycle;
  className?: string;
}) {
  const t = useTranslations("events");

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px] font-medium capitalize",
        LIFECYCLE_CLASS[lifecycle],
        className,
      )}
    >
      {t(`lifecycle.${lifecycle}`)}
    </Badge>
  );
}
