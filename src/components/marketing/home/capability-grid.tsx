"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import {
  Reveal,
  SectionIntro,
  SectionShell,
  marketingDisplayClass,
} from "./reveal";

const FEATURE_KEYS = [
  "album",
  "wall",
  "music",
  "wishes",
  "qr",
  "moderation",
  "private",
  "download",
] as const;

export function HomeCapabilities() {
  const t = useTranslations("marketing.home");

  return (
    <section className="border-y border-white/8 bg-black/20 py-24 sm:py-28">
      <SectionShell>
        <Reveal>
          <SectionIntro
            eyebrow={t("capsEyebrow")}
            title={t("capsTitle")}
            description={t("capsSubtitle")}
          />
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-10">
          <Reveal>
            <div className="overflow-hidden rounded-md border border-white/10 bg-black/25">
              <div className="relative aspect-[16/10]">
                <Image
                  src="/marketing/demos/album-hero.png"
                  alt={t("caps.album.title")}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="border-t border-white/10 p-6 sm:p-7">
                <h3 className={cn(marketingDisplayClass, "text-2xl sm:text-3xl")}>
                  {t("caps.album.title")}
                </h3>
                <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-white/55 sm:text-base">
                  {t("caps.album.desc")}
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="overflow-hidden rounded-md border border-white/10 bg-black/25">
              <div className="relative aspect-[16/10]">
                <Image
                  src="/marketing/demos/wall-stage.png"
                  alt={t("caps.wall.title")}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="border-t border-white/10 p-6 sm:p-7">
                <h3 className={cn(marketingDisplayClass, "text-2xl sm:text-3xl")}>
                  {t("caps.wall.title")}
                </h3>
                <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-white/55 sm:text-base">
                  {t("caps.wall.desc")}
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_KEYS.map((key) => (
              <li
                key={key}
                className="rounded-md border border-white/10 bg-white/[0.02] p-5"
              >
                <h3 className="text-[15px] font-semibold text-foreground">
                  {t(`caps.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/48">
                  {t(`caps.${key}.desc`)}
                </p>
                {key === "music" || key === "wishes" ? (
                  <p className="mt-3 text-xs leading-relaxed text-white/32">
                    {t(`caps.${key}.note`)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Reveal>
      </SectionShell>
    </section>
  );
}

/** @deprecated Use HomeCapabilities */
export function HomeCapabilityGrid() {
  return <HomeCapabilities />;
}
