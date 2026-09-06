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
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {t("compareTitle")}
        </h2>
        <p className="mt-3 text-muted-foreground sm:text-lg">{t("compareSubtitle")}</p>
      </Reveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-primary">{t("compareUsTitle")}</h3>
            <ul className="mt-6 space-y-3.5">
              {US_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-3 text-sm sm:text-base">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                  {t(`compareUs.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="h-full rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
            <h3 className="text-xl font-bold text-muted-foreground">
              {t("compareThemTitle")}
            </h3>
            <ul className="mt-6 space-y-3.5">
              {THEM_KEYS.map((key) => (
                <li
                  key={key}
                  className="flex items-start gap-3 text-sm text-muted-foreground sm:text-base"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
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
        <Button size="lg" className="h-12 rounded-xl px-8" asChild>
          <Link href="/register">{t("compareCta")}</Link>
        </Button>
      </Reveal>
    </SectionShell>
  );
}
