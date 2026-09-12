import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function OrgEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
  className,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-lg border border-white/10 bg-white/[0.02] px-6 py-10",
        className,
      )}
    >
      {icon ? <div className="mb-4 text-muted-foreground">{icon}</div> : null}
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <Button variant="gold" size="sm" className="mt-5 h-9" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
