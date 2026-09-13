"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Reveal, SectionIntro, SectionShell } from "@/components/marketing/home/reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const FEATURES = [
  { key: "album", src: "/marketing/demos/album-hero.png" },
  { key: "wall", src: "/marketing/demos/wall-stage.png" },
  { key: "qr", src: "/marketing/demos/upload-guest.png" },
  { key: "msg", src: "/marketing/demos/album-3.png" },
  { key: "mod", src: "/marketing/demos/album-4.png" },
  { key: "brand", src: "/marketing/demos/occasion-wedding.png" },
] as const;

export default function FeaturesPage() {
  const t = useTranslations("marketing.evento");

  return (
    <div>
      <SectionShell className="py-16 sm:py-20">
        <Reveal>
          <SectionIntro
            title={t("productPage.title")}
            description={t("productPage.subtitle")}
            align="center"
            className="mx-auto"
          />
          <div className="mt-8 flex justify-center">
            <Button variant="gold" size="lg" className="h-11 rounded-lg px-6 font-semibold shadow-none" asChild>
              <Link href="/register">{t("ctaCreate")}</Link>
            </Button>
          </div>
        </Reveal>

        <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-24">
          {FEATURES.map((item, i) => (
            <Reveal key={item.key}>
              <div
                className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-14 ${
                  i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-neutral-900/10">
                  <Image src={item.src} alt="" fill className="object-cover" sizes="50vw" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                    {t(`productPage.${item.key}Title`)}
                  </h2>
                  <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-neutral-600">
                    {t(`productPage.${item.key}Desc`)}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
