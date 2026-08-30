"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

const plans = [
  {
    key: "planFree",
    descKey: "planFreeDesc",
    slug: "free",
    price: "€0",
    features: ["featureGuests", "featureInvitations", "featureTimeline"],
    highlighted: false,
    checkout: false,
  },
  {
    key: "planPro",
    descKey: "planProDesc",
    slug: "pro",
    price: "€79",
    features: ["featureGuests", "featureSeating", "featureAnalytics", "featureTeam"],
    highlighted: true,
    checkout: true,
  },
  {
    key: "planEnterprise",
    descKey: "planEnterpriseDesc",
    slug: "enterprise",
    price: "Custom",
    features: ["featureGuests", "featureSeating", "featureAnalytics", "featureTeam"],
    highlighted: false,
    checkout: false,
  },
] as const;

export default function PricingPage() {
  const t = useTranslations("marketing");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState<string | null>(null);

  const startCheckout = async (planSlug: string) => {
    setLoading(planSlug);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      } else if (res.status === 401) {
        window.location.href = "/login?callbackUrl=/pricing";
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t("pricingTitle")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("pricingSubtitle")}</p>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.key}
            className={
              plan.highlighted
                ? "border-primary/40 bg-gradient-to-b from-primary/5 to-card shadow-lg ring-1 ring-primary/20"
                : "surface-elevated"
            }
          >
            <CardHeader>
              <CardTitle>{t(plan.key)}</CardTitle>
              <p className="text-sm text-muted-foreground">{t(plan.descKey)}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.price !== "Custom" ? (
                  <span className="text-muted-foreground">{t("perMonth")}</span>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{t(feature)}</span>
                  </li>
                ))}
              </ul>
              {plan.checkout ? (
                <Button
                  variant={plan.highlighted ? "gold" : "outline"}
                  className="mt-8 w-full"
                  disabled={loading === plan.slug}
                  onClick={() => startCheckout(plan.slug)}
                >
                  {tCommon("getStarted")}
                </Button>
              ) : (
                <Button
                  variant={plan.highlighted ? "gold" : "outline"}
                  className="mt-8 w-full"
                  asChild
                >
                  <Link href={plan.price === "Custom" ? "/contact" : "/register"}>
                    {plan.price === "Custom" ? t("contactSales") : tCommon("getStarted")}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
