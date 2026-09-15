"use client";

import { Check, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import type { FreeEventQuota } from "@/components/billing/free-event-quota-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/navigation";

interface BillingOverviewProps {
  quota: FreeEventQuota;
  orgSlug: string;
}

const PREMIUM_FEATURE_KEYS = [
  "premiumFeatureApproval",
  "premiumFeatureMediaTypes",
  "premiumFeatureDownload",
  "premiumFeatureBranding",
] as const;

export function BillingOverviewPanel({ quota, orgSlug }: BillingOverviewProps) {
  const t = useTranslations("billing");
  const usedPct =
    quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 0;
  const exhausted = quota.remaining === 0;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-gold/10 via-transparent to-transparent p-6 sm:p-8">
        <p className="text-sm font-medium text-muted-foreground">
          {t("freeAllowanceTitle")}
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-foreground sm:text-5xl">
          {exhausted
            ? t("freeAllowanceExhausted")
            : t("freeEventsRemaining", { count: quota.remaining })}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("freeAllowanceUsed", { used: quota.used, limit: quota.limit })}
        </p>
        <Progress value={usedPct} className="mt-5 h-1.5" />
        {exhausted ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {t("freeAllowanceExhaustedHint")}
          </p>
        ) : null}
      </section>

      <section className="surface-elevated rounded-xl p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("premiumTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("premiumDesc")}
              </p>
            </div>
            <ul className="space-y-2">
              {PREMIUM_FEATURE_KEYS.map((key) => (
                <li
                  key={key}
                  className="flex items-start gap-2 text-sm text-foreground/90"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <Button variant="gold" asChild className="h-9">
              <Link href={`/org/${orgSlug}/events/new`}>
                {t("buyPremiumEventCta")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <p className="text-sm text-muted-foreground">{t("upgradeExistingTip")}</p>
    </div>
  );
}
