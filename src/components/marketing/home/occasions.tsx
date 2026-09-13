"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { Reveal, SectionShell, marketingDisplayClass } from "./reveal";

export function HomeOccasions() {
  const t = useTranslations("marketing.home");

  return (
    <section className="overflow-hidden bg-black/25 py-24 sm:py-32">
      <SectionShell>
        <Reveal className="max-w-xl">
          <h2
            className={cn(
              marketingDisplayClass,
              "text-[clamp(2rem,3.5vw,3.25rem)] leading-[1.1]",
            )}
          >
            {t("occasionsTitle")}
          </h2>
          <p className="mt-4 max-w-[36ch] text-base leading-relaxed text-white/55 sm:text-lg">
            {t("occasionsSubtitle")}
          </p>
        </Reveal>
      </SectionShell>

      <div className="relative mt-14 sm:mt-16">
        <div className="mx-auto grid max-w-7xl grid-cols-12 items-end gap-3 px-4 sm:gap-4 sm:px-6 lg:gap-5 lg:px-8">
          <Reveal className="col-span-12 sm:col-span-5 lg:col-span-4">
            <figure className="relative aspect-[3/4] overflow-hidden rounded-md">
              <Image
                src="/marketing/demos/occasion-wedding.png"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 40vw"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
                <p className="text-lg text-white">{t("occasionCards.wedding.title")}</p>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.05} className="col-span-6 sm:col-span-3 lg:col-span-3">
            <figure className="relative aspect-[4/5] overflow-hidden rounded-md sm:mb-10">
              <Image
                src="/marketing/demos/occasion-party.png"
                alt=""
                fill
                className="object-cover"
                sizes="30vw"
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-sm text-white/90">{t("occasionCards.party.title")}</p>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.08} className="col-span-6 sm:col-span-4 lg:col-span-5">
            <figure className="relative aspect-[16/11] overflow-hidden rounded-md">
              <Image
                src="/marketing/demos/occasion-birthday.png"
                alt=""
                fill
                className="object-cover"
                sizes="40vw"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-12">
                <p className="text-base text-white">{t("occasionCards.birthday.title")}</p>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.1} className="col-span-7 sm:col-span-5 lg:col-span-5">
            <figure className="relative aspect-[16/10] overflow-hidden rounded-md">
              <Image
                src="/marketing/demos/occasion-corporate.png"
                alt=""
                fill
                className="object-cover"
                sizes="45vw"
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-sm text-white/90">{t("occasionCards.corporate.title")}</p>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.12} className="col-span-5 sm:col-span-3 lg:col-span-3">
            <figure className="relative aspect-square overflow-hidden rounded-md sm:-mt-8">
              <Image
                src="/marketing/demos/occasion-conference.png"
                alt=""
                fill
                className="object-cover"
                sizes="25vw"
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-sm text-white/90">{t("occasionCards.conference.title")}</p>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>

      <SectionShell className="mt-12 sm:mt-14">
        <Reveal>
          <Link
            href="/register"
            className="inline-flex text-[15px] font-semibold text-accent underline-offset-4 hover:underline"
          >
            {t("occasionStart")}
          </Link>
        </Reveal>
      </SectionShell>
    </section>
  );
}
