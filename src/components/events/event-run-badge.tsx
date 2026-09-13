"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { EventRunPhase } from "@/server/events/event-ended";
import { cn } from "@/lib/utils";

const PHASE_CLASS: Record<EventRunPhase, string> = {
  idle: "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/5",
  live: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/10",
  paused:
    "border-amber-500/25 bg-amber-500/10 text-amber-200 hover:bg-amber-500/10",
  stopped: "border-white/10 bg-transparent text-muted-foreground hover:bg-transparent",
  locked: "border-white/10 bg-transparent text-muted-foreground hover:bg-transparent",
};

export function EventRunBadge({
  phase,
  className,
}: {
  phase: EventRunPhase;
  className?: string;
}) {
  const t = useTranslations("eventWorkspace.home");

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px] font-medium capitalize",
        PHASE_CLASS[phase],
        className,
      )}
    >
      {t(`runPhase.${phase}`)}
    </Badge>
  );
}
