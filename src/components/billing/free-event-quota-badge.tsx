"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type FreeEventQuota = {
  used: number;
  limit: number;
  remaining: number;
  canCreateFree: boolean;
};

export function FreeEventQuotaBadge({
  quota,
  className,
}: {
  quota: FreeEventQuota;
  className?: string;
}) {
  const t = useTranslations("dashboard");

  if (quota.remaining > 0) {
    return (
      <span
        className={cn(
          "inline-flex h-9 items-center rounded-md border border-gold/30 bg-gold/10 px-3 text-sm font-medium text-gold tabular-nums",
          className,
        )}
      >
        {t("freeEventsRemaining", { count: quota.remaining })}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-9 items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-muted-foreground",
        className,
      )}
    >
      {t("freeLimitReached")}
    </span>
  );
}
