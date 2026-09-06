"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { Reveal, SectionShell } from "./reveal";

const OCCASIONS = [
  {
    key: "wedding" as const,
    src: "/marketing/demos/occasion-wedding.png",
    href: "/features",
  },
  {
    key: "party" as const,
    src: "/marketing/demos/occasion-party.png",
    href: "/features",
  },
  {
    key: "birthday" as const,
    src: "/marketing/demos/occasion-birthday.png",
    href: "/features",
  },
  {
    key: "conference" as const,
    src: "/marketing/demos/occasion-conference.png",
    href: "/features",
  },
  {
    key: "corporate" as const,
    src: "/marketing/demos/occasion-corporate.png",
    href: "/features",
  },
  {
    key: "other" as const,
    src: "/marketing/demos/occasion-other.png",
    href: "/register",
  },
] as const;

export function HomeOccasions() {
  const t = useTranslations("marketing.home");

  return (
    <section className="border-y border-white/10 bg-black/20 py-20 sm:py-28">
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
                className="group glass-panel flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1 hover:border-white/20"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="font-semibold">{t(`occasionCards.${key}.title`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`occasionCards.${key}.desc`)}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-accent">
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
