"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const plans = [
  {
    key: "free" as const,
    slug: "free",
    price: "€0",
    features: ["freeF1", "freeF2", "freeF3"] as const,
    highlighted: false,
    checkout: false,
  },
  {
    key: "pro" as const,
    slug: "pro",
    price: "Premium",
    features: ["proF1", "proF2", "proF3", "proF4"] as const,
    highlighted: true,
    checkout: false,
  },
  {
    key: "ent" as const,
    slug: "enterprise",
    price: "Custom",
    features: ["entF1", "entF2", "entF3", "entF4"] as const,
    highlighted: false,
    checkout: false,
  },
];

export default function PricingPage() {
  const t = useTranslations("marketing.evento");
  const tp = useTranslations("marketing.evento.pricingPage");
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
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
          {tp("title")}
        </h1>
        <p className="mt-4 text-lg text-neutral-600">{tp("subtitle")}</p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={cn(
              "flex flex-col rounded-2xl border p-7 sm:p-8",
              plan.highlighted
                ? "border-[#C4A574]/50 bg-[#C4A574]/8 shadow-[0_20px_50px_-30px_rgba(166,124,82,0.45)]"
                : "border-neutral-900/10 bg-white",
            )}
          >
            <h2 className="text-xl font-semibold text-neutral-950">
              {tp(`${plan.key}Name`)}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">{tp(`${plan.key}Desc`)}</p>
            <div className="mt-6">
              <span className="text-4xl font-semibold tracking-tight text-neutral-950">
                {plan.price}
              </span>
              {plan.price !== "Custom" ? (
                <span className="text-neutral-500">{tp("perMonth")}</span>
              ) : null}
            </div>
            <ul className="mt-8 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#A67C52]" />
                  <span>{tp(feature)}</span>
                </li>
              ))}
            </ul>
            {plan.key === "pro" ? (
              <Button
                variant="gold"
                className="mt-8 h-11 w-full rounded-lg font-semibold shadow-none"
                asChild
              >
                <Link href="/register">{tp("buyPremiumEvents")}</Link>
              </Button>
            ) : plan.checkout ? (
              <Button
                variant="gold"
                className="mt-8 h-11 w-full rounded-lg font-semibold shadow-none"
                disabled={loading === plan.slug}
                onClick={() => startCheckout(plan.slug)}
              >
                {t("ctaCreate")}
              </Button>
            ) : (
              <Button
                variant={plan.highlighted ? "gold" : "outline"}
                className="mt-8 h-11 w-full rounded-lg font-semibold shadow-none"
                asChild
              >
                <Link href={plan.price === "Custom" ? "/contact" : "/register"}>
                  {plan.price === "Custom" ? tp("contactSales") : t("ctaCreate")}
                </Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
