"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CirclePlay, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { HeroDevicesMockup } from "./product-mockups";
import { LaurelWreath } from "./laurel-wreath";
import { SectionShell } from "./reveal";

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
    }, 2600);
    return () => window.clearInterval(id);
  }, [reduce]);

  const occasion = t(`occasions.${OCCASION_KEYS[index]}`);

  return (
    <SectionShell className="max-w-7xl pb-8 pt-10 sm:pb-10 sm:pt-14 md:pb-12 md:pt-16">
      <div className="grid items-center gap-10 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-10 lg:gap-14">
        <div className="text-center md:text-left">
          <div className="mb-5 inline-flex flex-col items-center gap-1.5 md:items-start">
            <div className="inline-flex items-center gap-2.5 text-sm font-bold tracking-tight text-foreground">
              <LaurelWreath side="left" className="h-9 w-7" />
              <span>{t("badge")}</span>
              <LaurelWreath side="right" className="h-9 w-7" />
            </div>
            <div
              className="flex items-center gap-0.5 text-foreground"
              aria-hidden
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-foreground" />
              ))}
            </div>
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-[2.75rem] md:leading-[1.12] lg:text-[3.25rem] xl:text-[3.5rem]">
            {t("heroLead")}{" "}
            <span className="inline-flex min-h-[1.12em] min-w-[6ch] justify-center text-primary sm:min-w-[8ch] md:justify-start">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={OCCASION_KEYS[index]}
                  className="inline-block"
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {occasion}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg md:mx-0">
            {t("heroSubtitle")}
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center md:justify-start">
            <Button
              variant="default"
              size="lg"
              className="h-12 rounded-full px-8 text-base font-semibold shadow-none transition-transform hover:-translate-y-0.5"
              asChild
            >
              <Link href="/register">{t("heroCta")}</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-foreground/25 bg-background px-8 text-base font-medium shadow-none transition-transform hover:-translate-y-0.5 hover:bg-muted/40"
              asChild
            >
              <a href="#how-it-works">
                <CirclePlay className="h-5 w-5" />
                {t("heroSecondaryCta")}
              </a>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t("heroMicro")}</p>
        </div>

        <div className="relative pb-6 sm:pb-8 md:pb-4">
          <HeroDevicesMockup />
        </div>
      </div>
    </SectionShell>
  );
}
