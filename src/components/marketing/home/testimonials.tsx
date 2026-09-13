"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Reveal, SectionShell, marketingDisplayClass } from "./reveal";

export function HomeTestimonials() {
  const t = useTranslations("marketing.home");

  return (
    <section className="bg-black/25 py-24 sm:py-32">
      <SectionShell>
        <Reveal className="max-w-xl">
          <h2
            className={cn(
              marketingDisplayClass,
              "text-[clamp(2rem,3.5vw,3.25rem)] leading-[1.1]",
            )}
          >
            {t("testimonialsTitle")}
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] lg:gap-20">
          <Reveal>
            <figure>
              <blockquote
                className={cn(
                  marketingDisplayClass,
                  "text-[clamp(1.5rem,2.5vw,2.25rem)] font-medium leading-[1.25] text-foreground",
                )}
              >
                “{t("testimonials.1.quote")}”
              </blockquote>
              <figcaption className="mt-8">
                <p className="font-medium text-foreground">{t("testimonials.1.name")}</p>
                <p className="mt-1 text-sm text-white/45">{t("testimonials.1.meta")}</p>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.08} className="flex flex-col justify-end border-t border-white/10 pt-10 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <figure>
              <blockquote className="text-base leading-relaxed text-white/70 sm:text-lg">
                “{t("testimonials.3.quote")}”
              </blockquote>
              <figcaption className="mt-6">
                <p className="text-sm font-medium text-foreground">
                  {t("testimonials.3.name")}
                </p>
                <p className="mt-1 text-sm text-white/40">{t("testimonials.3.meta")}</p>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </SectionShell>
    </section>
  );
}
