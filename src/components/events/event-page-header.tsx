import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EventPageHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

export function EventPageHeader({ title, action, className }: EventPageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <h1 className="text-xl font-semibold">{title}</h1>
      {action}
    </div>
  );
}
