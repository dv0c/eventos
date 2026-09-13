"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { Reveal, SectionIntro, SectionShell } from "./reveal";

const OCCASIONS = [
  {
    key: "wedding",
    src: "/marketing/demos/occasion-wedding.png",
    span: "sm:col-span-6 lg:col-span-4",
  },
  {
    key: "party",
    src: "/marketing/demos/occasion-party.png",
    span: "sm:col-span-6 lg:col-span-4",
  },
  {
    key: "birthday",
    src: "/marketing/demos/occasion-birthday.png",
    span: "sm:col-span-6 lg:col-span-4",
  },
  {
    key: "corporate",
    src: "/marketing/demos/occasion-corporate.png",
    span: "sm:col-span-6 lg:col-span-4",
  },
  {
    key: "conference",
    src: "/marketing/demos/occasion-conference.png",
    span: "sm:col-span-6 lg:col-span-4",
  },
  {
    key: "other",
    src: "/marketing/demos/occasion-other.png",
    span: "sm:col-span-6 lg:col-span-4",
  },
] as const;

export function HomeOccasions() {
  const t = useTranslations("marketing.home");

  return (
    <section className="py-24 sm:py-28">
      <SectionShell>
        <Reveal>
          <SectionIntro
            eyebrow={t("occasionsEyebrow")}
            title={t("occasionsTitle")}
            description={t("occasionsSubtitle")}
          />
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-12 sm:gap-5">
          {OCCASIONS.map((item, index) => (
            <Reveal
              key={item.key}
              delay={index * 0.03}
              className={`col-span-12 ${item.span}`}
            >
              <article className="flex h-full flex-col overflow-hidden rounded-md border border-white/10 bg-white/[0.02]">
                <div className="relative aspect-[16/11]">
                  <Image
                    src={item.src}
                    alt={t(`occasionCards.${item.key}.title`)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    {t(`occasionCards.${item.key}.title`)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50">
                    {t(`occasionCards.${item.key}.desc`)}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/register"
            className="inline-flex text-[15px] font-semibold text-accent underline-offset-4 hover:underline"
          >
            {t("occasionStart")}
          </Link>
          <Link
            href="/features"
            className="inline-flex text-[15px] font-medium text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            {t("occasionLearn")}
          </Link>
        </Reveal>
      </SectionShell>
    </section>
  );
}
