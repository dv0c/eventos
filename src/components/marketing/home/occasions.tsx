"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { Reveal, SectionShell } from "./reveal";

const OCCASIONS = [
  { key: "wedding" as const, src: "/wizard/event-types/wedding.png", href: "/features" },
  { key: "party" as const, src: "/wizard/event-types/party.png", href: "/features" },
  { key: "birthday" as const, src: "/wizard/event-types/birthday.png", href: "/features" },
  { key: "conference" as const, src: "/wizard/event-types/conference.png", href: "/features" },
  { key: "corporate" as const, src: "/wizard/event-types/corporate.png", href: "/features" },
  { key: "other" as const, src: "/wizard/event-types/other.png", href: "/register" },
] as const;

export function HomeOccasions() {
  const t = useTranslations("marketing.home");

  return (
    <section className="border-y border-border/50 bg-secondary/20 py-20 sm:py-28">
      <SectionShell>
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("occasionsTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">{t("occasionsSubtitle")}</p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {OCCASIONS.map(({ key, src, href }, i) => (
            <Reveal key={key} delay={i * 0.05}>
              <Link
                href={href}
                className="group flex h-full items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-primary/5">
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-contain p-1.5"
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{t(`occasionCards.${key}.title`)}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t(`occasionCards.${key}.desc`)}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {key === "other" ? t("occasionStart") : t("occasionLearn")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </SectionShell>
    </section>
  );
}
