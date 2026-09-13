"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { Reveal, SectionShell } from "./reveal";

const US_KEYS = ["1", "2", "3", "4", "5", "6"] as const;
const THEM_KEYS = ["1", "2", "3", "4", "5", "6"] as const;

export function HomeComparison() {
  const t = useTranslations("marketing.home");

  return (
    <SectionShell className="py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-accent/90">{t("compareScene")}</p>
        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {t("compareTitle")}
        </h2>
        <p className="mt-3 text-muted-foreground sm:text-lg">{t("compareSubtitle")}</p>
      </Reveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="glass-panel relative h-full overflow-hidden border-accent/30 bg-accent/5 p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
            <h3 className="relative text-xl font-bold text-accent">{t("compareUsTitle")}</h3>
            <p className="relative mt-2 text-sm text-muted-foreground">{t("compareUsLead")}</p>
            <ul className="relative mt-6 space-y-3.5">
              {US_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-3 text-sm sm:text-base">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                  {t(`compareUs.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="glass-panel h-full p-6 sm:p-8">
            <h3 className="text-xl font-bold text-muted-foreground">
              {t("compareThemTitle")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground/80">{t("compareThemLead")}</p>
            <ul className="mt-6 space-y-3.5">
              {THEM_KEYS.map((key) => (
                <li
                  key={key}
                  className="flex items-start gap-3 text-sm text-muted-foreground sm:text-base"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <X className="h-3 w-3" />
                  </span>
                  {t(`compareThem.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      <Reveal className="mt-10 text-center">
        <Button variant="gold" size="lg" className="h-12 rounded-xl px-8" asChild>
          <Link href="/register">{t("compareCta")}</Link>
        </Button>
      </Reveal>
    </SectionShell>
  );
}
