import { CalendarDays } from "lucide-react";

import { OrgEmptyState } from "@/components/organization/org-empty-state";

interface DashboardEmptyEventsProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

/** @deprecated Prefer OrgEmptyState; kept as thin wrapper for existing imports. */
export function DashboardEmptyEvents({
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: DashboardEmptyEventsProps) {
  return (
    <OrgEmptyState
      title={title}
      description={description}
      actionLabel={actionLabel}
      actionHref={actionHref}
      className={className}
      icon={<CalendarDays className="h-5 w-5" />}
    />
  );
}
