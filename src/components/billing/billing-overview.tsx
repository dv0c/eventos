"use client";

import { CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/format";
import type { BillingOverview } from "@/server/services/billing.service";

interface BillingOverviewProps {
  overview: BillingOverview;
  locale: "el" | "en";
  orgSlug: string;
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

export function BillingOverviewPanel({ overview, locale, orgSlug }: BillingOverviewProps) {
  const t = useTranslations("billing");
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
            <p className="mt-1 text-muted-foreground">{t("eventPurchasesDesc")}</p>
          </div>
          <Badge variant="gold">{overview.plan.name}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-2xl font-bold">
            {formatCurrency(overview.plan.priceMonthly / 100, locale)}
            <span className="text-sm font-normal text-muted-foreground">
              {t("perMonth")}
            </span>
          </p>
          <Button variant="gold" asChild>
            <Link href={`/org/${orgSlug}/events/new`}>{t("buyPremiumEventCta")}</Link>
          </Button>
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
                    <span className="tabular-nums text-muted-foreground">
                      {value}
                      {limit > 0 ? ` / ${limit}` : ""}
                    </span>
                  </div>
                  {limit > 0 ? <Progress value={pct} /> : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
