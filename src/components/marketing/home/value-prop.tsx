"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { Reveal, SectionIntro, SectionShell, marketingDisplayClass } from "./reveal";

const PILLARS = [
  {
    key: "wall" as const,
    image: "/marketing/demos/wall-stage.png",
    chips: ["chip1", "chip2", "chip3"] as const,
  },
  {
    key: "easy" as const,
    image: "/marketing/demos/upload-guest.png",
  },
  {
    key: "host" as const,
    image: "/marketing/demos/album-hero.png",
  },
] as const;

export function HomeValueProp() {
  const t = useTranslations("marketing.home");

  return (
    <section className="py-24 sm:py-28">
      <SectionShell>
        <Reveal>
          <SectionIntro
            eyebrow={t("valueEyebrow")}
            title={t("valueTitle")}
            description={t("valueSubtitle")}
          />
          <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-white/45">
            {t("valueBody")}
          </p>
        </Reveal>

        <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-20">
          {PILLARS.map((pillar, index) => {
            const flip = index % 2 === 1;
            return (
              <Reveal key={pillar.key} delay={index * 0.04}>
                <div
                  className={cn(
                    "grid items-center gap-8 lg:grid-cols-2 lg:gap-14",
                    flip && "lg:[&>*:first-child]:order-2",
                  )}
                >
                  <div className="relative aspect-[16/11] overflow-hidden rounded-md border border-white/10 bg-black/30">
                    <Image
                      src={pillar.image}
                      alt={t(`features.${pillar.key}.title`)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  <div>
                    {pillar.key === "wall" ? (
                      <p className="mb-3 text-sm font-medium tracking-[0.04em] text-accent/90">
                        {t("features.wall.eyebrow")}
                      </p>
                    ) : null}
                    <h3
                      className={cn(
                        marketingDisplayClass,
                        "text-balance text-[clamp(1.6rem,2.4vw,2.35rem)] leading-tight",
                      )}
                    >
                      {t(`features.${pillar.key}.title`)}
                    </h3>
                    <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-white/55 sm:text-lg">
                      {t(`features.${pillar.key}.desc`)}
                    </p>
                    {pillar.key === "wall" ? (
                      <ul className="mt-6 flex flex-wrap gap-2">
                        {pillar.chips.map((chip) => (
                          <li
                            key={chip}
                            className="rounded-md border border-white/12 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/60"
                          >
                            {t(`features.wall.${chip}`)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-14 flex flex-col items-start gap-4 border-t border-white/10 pt-10 sm:mt-16 sm:flex-row sm:items-center">
          <Button
            variant="gold"
            size="lg"
            className="h-11 rounded-md px-7 font-semibold shadow-none"
            asChild
          >
            <Link href="/register">{t("valueCta")}</Link>
          </Button>
          <Link
            href="/features"
            className="text-[15px] font-medium text-white/65 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            {t("valueDemo")}
          </Link>
        </Reveal>
      </SectionShell>
    </section>
  );
}
