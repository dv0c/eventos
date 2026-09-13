"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { Reveal, SectionIntro, SectionShell, marketingDisplayClass } from "./reveal";

const US_KEYS = ["1", "2", "3", "4", "5", "6"] as const;
const THEM_KEYS = ["1", "2", "3", "4", "5", "6"] as const;

export function HomeComparison() {
  const t = useTranslations("marketing.home");

  return (
    <section className="py-24 sm:py-28">
      <SectionShell>
        <Reveal>
          <SectionIntro
            eyebrow={t("compareScene")}
            title={t("compareTitle")}
            description={t("compareSubtitle")}
            align="center"
            className="mx-auto"
          />
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-2 lg:gap-6">
          <Reveal>
            <div className="h-full rounded-md border border-accent/35 bg-accent/[0.06] p-6 sm:p-8">
              <h3
                className={cn(
                  marketingDisplayClass,
                  "text-xl text-accent sm:text-2xl",
                )}
              >
                {t("compareUsTitle")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {t("compareUsLead")}
              </p>
              <ul className="mt-7 space-y-3.5">
                {US_KEYS.map((key) => (
                  <li
                    key={key}
                    className="flex items-start gap-3 text-sm leading-snug text-white/80 sm:text-[15px]"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Check className="size-3" strokeWidth={2.5} />
                    </span>
                    {t(`compareUs.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="h-full rounded-md border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <h3
                className={cn(
                  marketingDisplayClass,
                  "text-xl text-white/55 sm:text-2xl",
                )}
              >
                {t("compareThemTitle")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/40">
                {t("compareThemLead")}
              </p>
              <ul className="mt-7 space-y-3.5">
                {THEM_KEYS.map((key) => (
                  <li
                    key={key}
                    className="flex items-start gap-3 text-sm leading-snug text-white/45 sm:text-[15px]"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/45">
                      <X className="size-3" />
                    </span>
                    {t(`compareThem.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-10 flex justify-center">
          <Button
            variant="gold"
            size="lg"
            className="h-12 rounded-md px-8 font-semibold shadow-none"
            asChild
          >
            <Link href="/register">{t("compareCta")}</Link>
          </Button>
        </Reveal>
      </SectionShell>
    </section>
  );
}
