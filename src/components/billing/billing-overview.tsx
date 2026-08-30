"use client";

import { useState } from "react";
import { CreditCard, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { BillingOverview } from "@/server/services/billing.service";

interface BillingOverviewProps {
  overview: BillingOverview;
  locale: "el" | "en";
}

const METRIC_LABELS: Record<string, string> = {
  events: "usageEvents",
  guests: "usageGuests",
  storage: "usageStorage",
  messages: "usageMessages",
  collaborators: "usageCollaborators",
};

const LIMIT_KEYS: Record<string, keyof BillingOverview["limits"]> = {
  events: "maxEvents",
  guests: "maxGuests",
  storage: "maxStorage",
  messages: "maxMessages",
  collaborators: "maxCollaborators",
};

export function BillingOverviewPanel({ overview, locale }: BillingOverviewProps) {
  const t = useTranslations("billing");
  const [loading, setLoading] = useState(false);

  const upgrade = async (planSlug: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });
      const json = await res.json();
      if (json.data?.url) window.location.href = json.data.url;
    } finally {
      setLoading(false);
    }
  };

  const usageMap = new Map(overview.usage.map((u) => [u.metric, u.value]));

  return (
    <div className="space-y-8">
      <Card className="surface-elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t("currentPlan")}
            </CardTitle>
            <p className="mt-1 text-muted-foreground">{overview.plan.description}</p>
          </div>
          <Badge variant="gold">{overview.plan.name}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-2xl font-bold">
            {formatCurrency(overview.plan.priceMonthly / 100, locale)}
            <span className="text-sm font-normal text-muted-foreground">{t("perMonth")}</span>
          </p>
          {overview.subscription ? (
            <p className="text-sm text-muted-foreground">
              {t("status")}: {overview.subscription.status}
            </p>
          ) : null}
          {overview.plan.slug !== "enterprise" ? (
            <Button variant="gold" disabled={loading} onClick={() => upgrade("pro")}>
              <TrendingUp className="h-4 w-4" />
              {t("upgradeCta")}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t("usageTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(METRIC_LABELS).map(([metric, labelKey]) => {
            const value = usageMap.get(metric) ?? 0;
            const limitKey = LIMIT_KEYS[metric];
            const limit = overview.limits[limitKey];
            const pct = limit > 0 ? Math.min(100, (value / limit) * 100) : 0;

            return (
              <Card key={metric} className="surface-elevated">
                <CardContent className="p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{t(labelKey)}</span>
                    <span className="text-muted-foreground">
                      {value} / {limit < 0 ? "∞" : limit}
                    </span>
                  </div>
                  {limit > 0 ? <Progress value={pct} className="h-2" /> : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
