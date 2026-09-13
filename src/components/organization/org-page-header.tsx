import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function OrgPageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  className,
  children,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {children}
        {actionLabel && actionHref ? (
          <Button variant="gold" asChild className="h-9">
            <Link href={actionHref}>
              <Plus className="h-4 w-4" />
              {actionLabel}
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
