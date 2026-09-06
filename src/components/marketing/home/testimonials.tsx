"use client";

import { useTranslations } from "next-intl";

import { Reveal, SectionShell } from "./reveal";

const KEYS = ["1", "2", "3"] as const;

export function HomeTestimonials() {
  const t = useTranslations("marketing.home");

  return (
    <section className="border-y border-white/10 bg-black/20 py-20 sm:py-28">
      <SectionShell>
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("testimonialsTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">
            {t("testimonialsSubtitle")}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {KEYS.map((key, i) => (
            <Reveal key={key} delay={i * 0.08}>
              <figure className="glass-panel flex h-full flex-col p-6">
                <blockquote className="flex-1 text-base leading-relaxed text-foreground">
                  “{t(`testimonials.${key}.quote`)}”
                </blockquote>
                <figcaption className="mt-6 border-t border-white/10 pt-4">
                  <p className="font-semibold">{t(`testimonials.${key}.name`)}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`testimonials.${key}.meta`)}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </SectionShell>
    </section>
  );
}
