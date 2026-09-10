"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Reveal, SectionShell, marketingDisplayClass } from "./reveal";

const STEPS = ["step1", "step2", "step3"] as const;

export function HomeStatement() {
  const t = useTranslations("marketing.home.miniSteps");

  return (
    <SectionShell className="py-20 sm:py-28">
      <Reveal>
        <p className="mb-10 max-w-xl text-sm font-medium tracking-[0.06em] text-white/45">
          {t("eyebrow")}
        </p>
        <ol className="grid gap-10 border-t border-white/10 pt-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-white/10">
          {STEPS.map((key) => (
            <li key={key} className="md:px-8 first:md:pl-0 last:md:pr-0">
              <p
                className={cn(
                  marketingDisplayClass,
                  "text-3xl text-white/90 sm:text-4xl",
                )}
              >
                {t(`phase.${key}`)}
              </p>
              <p className="mt-4 max-w-[22ch] text-base leading-snug text-foreground sm:text-lg">
                {t(key)}
              </p>
            </li>
          ))}
        </ol>
      </Reveal>
    </SectionShell>
  );
}

/** @deprecated Use HomeStatement */
export function HomeMiniSteps() {
  return <HomeStatement />;
}
