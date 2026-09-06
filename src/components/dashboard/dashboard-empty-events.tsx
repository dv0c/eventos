import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface DashboardEmptyEventsProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function DashboardEmptyEvents({
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: DashboardEmptyEventsProps) {
  return (
    <div
      className={cn(
        "dashboard-surface flex flex-col items-center px-6 py-10 text-center sm:items-start sm:px-8 sm:py-12 sm:text-left",
        className,
      )}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
        <CalendarDays className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <Button variant="gold" size="sm" className="mt-5" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
