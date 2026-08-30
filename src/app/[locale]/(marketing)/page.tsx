"use client";

import { ArrowRight, CalendarHeart, Sparkles, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export default function MarketingHomePage() {
  const t = useTranslations("marketing");
  const tCommon = useTranslations("common");

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-32 top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {tCommon("tagline")}
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient-gold">{t("heroTitle")}</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button variant="gold" size="lg" asChild>
              <Link href="/register">
                {t("heroCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/features">{t("heroSecondaryCta")}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          <Card className="surface-elevated border-primary/10">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <CalendarHeart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t("featureTimeline")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("featureTimelineDesc")}
              </p>
            </CardContent>
          </Card>
          <Card className="surface-elevated border-accent/20">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold">{t("featureGuests")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("featureGuestsDesc")}
              </p>
            </CardContent>
          </Card>
          <Card className="surface-elevated border-primary/10">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t("featureAnalytics")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("featureAnalyticsDesc")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t border-border/40 bg-gradient-to-b from-secondary/30 to-background py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">{t("ctaTitle")}</h2>
          <p className="mt-4 text-muted-foreground">{t("ctaSubtitle")}</p>
          <Button variant="gold" size="lg" className="mt-8" asChild>
            <Link href="/register">{tCommon("getStarted")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
