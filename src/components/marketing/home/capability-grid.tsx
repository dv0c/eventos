"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Reveal, SectionShell, marketingDisplayClass } from "./reveal";

const QUIET = ["qr", "moderation", "private", "download"] as const;

export function HomeCapabilities() {
  const t = useTranslations("marketing.home");

  return (
    <section className="py-24 sm:py-32">
      <SectionShell>
        <Reveal className="max-w-2xl">
          <h2
            className={cn(
              marketingDisplayClass,
              "text-[clamp(2rem,3.5vw,3.25rem)] leading-[1.1]",
            )}
          >
            {t("capsTitle")}
          </h2>
          <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-white/55 sm:text-lg">
            {t("capsSubtitle")}
          </p>
        </Reveal>

        <div className="mt-16 space-y-20">
          <Reveal>
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <div className="relative aspect-[16/11] overflow-hidden rounded-md">
                <Image
                  src="/marketing/demos/album-hero.png"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div>
                <h3
                  className={cn(
                    marketingDisplayClass,
                    "text-3xl sm:text-4xl",
                  )}
                >
                  {t("caps.album.title")}
                </h3>
                <p className="mt-4 max-w-[34ch] text-base leading-relaxed text-white/55 sm:text-lg">
                  {t("caps.album.desc")}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <div className="order-2 lg:order-1">
                <h3
                  className={cn(
                    marketingDisplayClass,
                    "text-3xl sm:text-4xl",
                  )}
                >
                  {t("caps.wall.title")}
                </h3>
                <p className="mt-4 max-w-[34ch] text-base leading-relaxed text-white/55 sm:text-lg">
                  {t("caps.wall.desc")}
                </p>
              </div>
              <div className="relative order-1 aspect-[16/11] overflow-hidden rounded-md lg:order-2">
                <Image
                  src="/marketing/demos/wall-stage.png"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid gap-10 border-t border-white/10 pt-12 md:grid-cols-2">
              <div>
                <h3
                  className={cn(
                    marketingDisplayClass,
                    "text-2xl sm:text-3xl",
                  )}
                >
                  {t("caps.music.title")}
                </h3>
                <p className="mt-3 max-w-[36ch] text-base leading-relaxed text-white/55">
                  {t("caps.music.desc")}
                </p>
              </div>
              <div>
                <h3
                  className={cn(
                    marketingDisplayClass,
                    "text-2xl sm:text-3xl",
                  )}
                >
                  {t("caps.wishes.title")}
                </h3>
                <p className="mt-3 max-w-[36ch] text-base leading-relaxed text-white/55">
                  {t("caps.wishes.desc")}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <ul className="flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-10 text-sm text-white/45 sm:gap-x-12 sm:text-[15px]">
              {QUIET.map((key) => (
                <li key={key}>{t(`caps.${key}.title`)}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </SectionShell>
    </section>
  );
}

/** @deprecated Use HomeCapabilities */
export function HomeCapabilityGrid() {
  return <HomeCapabilities />;
}
