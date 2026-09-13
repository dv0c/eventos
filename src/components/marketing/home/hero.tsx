"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { HeroEditorialComposition } from "./product-mockups";
import { Reveal, SectionShell, marketingDisplayClass } from "./reveal";

const OCCASION_KEYS = [
  "wedding",
  "birthday",
  "party",
  "corporate",
  "conference",
  "baptism",
] as const;

export function HomeHero() {
  const t = useTranslations("marketing.home");
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % OCCASION_KEYS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [reduce]);

  const occasion = t(`occasions.${OCCASION_KEYS[index]}`);

  return (
    <SectionShell className="overflow-x-clip pb-16 pt-10 sm:pb-20 sm:pt-14 md:pb-28 md:pt-16">
      <div className="grid items-center gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-12 lg:gap-16">
        <Reveal className="text-left">
          <p className="mb-5 text-sm font-medium tracking-[0.04em] text-white/50">
            {t("badge")}
          </p>

          <h1
            className={cn(
              marketingDisplayClass,
              "text-balance text-[clamp(2.4rem,5vw,4.5rem)] leading-[1.05] text-foreground",
            )}
          >
            {t("heroLead")}{" "}
            <span className="inline-flex min-h-[1.05em] min-w-[5ch] text-accent">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={OCCASION_KEYS[index]}
                  className="inline-block"
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {occasion}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="mt-6 max-w-[36ch] text-pretty text-base leading-relaxed text-white/60 sm:text-lg">
            {t("heroSubtitle")}
          </p>

          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button
              variant="gold"
              size="lg"
              className="h-12 rounded-md px-8 text-base font-semibold shadow-none"
              asChild
            >
              <Link href="/register">{t("heroCta")}</Link>
            </Button>
            <a
              href="#how-it-works"
              className="text-[15px] font-medium text-white/65 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {t("heroSecondaryCta")}
            </a>
          </div>
          <p className="mt-4 text-sm text-white/40">{t("heroMicro")}</p>
        </Reveal>

        <Reveal delay={0.08} className="relative pb-8 sm:pb-10 md:pb-6">
          <HeroEditorialComposition />
        </Reveal>
      </div>
    </SectionShell>
  );
}
