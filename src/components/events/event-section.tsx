import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EventSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function EventSection({ title, children, className }: EventSectionProps) {
  return (
    <section className={cn("event-surface p-5 sm:p-6", className)}>
      {title ? (
        <h2 className="mb-4 text-base font-medium">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}
