"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Reveal, SectionIntro, SectionShell, marketingDisplayClass } from "./reveal";

const STEPS = ["step1", "step2", "step3"] as const;

export function HomeStatement() {
  const t = useTranslations("marketing.home.miniSteps");

  return (
    <section className="border-y border-white/8 bg-black/20 py-20 sm:py-24">
      <SectionShell>
        <Reveal>
          <SectionIntro eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
          <ol className="mt-14 grid gap-8 sm:gap-10 md:grid-cols-3 md:gap-6 lg:gap-10">
            {STEPS.map((key, index) => (
              <li
                key={key}
                className="relative rounded-md border border-white/10 bg-white/[0.02] p-6 sm:p-7"
              >
                <p className="text-xs font-medium tracking-[0.14em] text-white/35">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p
                  className={cn(
                    marketingDisplayClass,
                    "mt-4 text-2xl text-white/92 sm:text-[1.65rem]",
                  )}
                >
                  {t(`phase.${key}`)}
                </p>
                <p className="mt-3 text-base font-medium leading-snug text-foreground">
                  {t(key)}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/48">
                  {t(`support.${key}`)}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </SectionShell>
    </section>
  );
}

/** @deprecated Use HomeStatement */
export function HomeMiniSteps() {
  return <HomeStatement />;
}
