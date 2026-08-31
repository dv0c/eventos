import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";

interface DashboardEmptyEventsProps {
  title: string;
  description: string;
  className?: string;
}

export function DashboardEmptyEvents({
  title,
  description,
  className,
}: DashboardEmptyEventsProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-secondary/20 px-6 py-10 sm:px-8 sm:py-12",
        "flex flex-col items-center text-center sm:max-w-xl sm:items-start sm:text-left",
        className,
      )}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8">
        <CalendarDays className="h-5 w-5 text-primary/80" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
