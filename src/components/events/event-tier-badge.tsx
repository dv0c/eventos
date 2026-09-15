"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { isEventPremium } from "@/lib/event-premium";
import { cn } from "@/lib/utils";

export function EventTierBadge({
  tier,
  isPremium,
  className,
}: {
  tier?: string | null;
  isPremium?: boolean;
  className?: string;
}) {
  const t = useTranslations("eventWorkspace");
  const premium =
    typeof isPremium === "boolean" ? isPremium : isEventPremium({ tier });

  if (premium) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "rounded-md border-gold/40 bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold hover:bg-gold/10",
          className,
        )}
      >
        {t("tierPlus")}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-white/5",
        className,
      )}
    >
      {t("tierFree")}
    </Badge>
  );
}
