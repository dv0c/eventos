"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { Reveal, SectionShell, marketingDisplayClass } from "./reveal";

export function HomeValueProp() {
  const t = useTranslations("marketing.home");

  return (
    <section className="bg-black/25 py-24 sm:py-32">
      <SectionShell>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          <Reveal className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-md sm:aspect-[5/4] lg:-ml-4 lg:aspect-auto lg:min-h-[420px] xl:-ml-8">
              <Image
                src="/marketing/demos/wall-stage.png"
                alt=""
                fill
                className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
            </div>
          </Reveal>

          <Reveal delay={0.06} className="order-1 lg:order-2">
            <h2
              className={cn(
                marketingDisplayClass,
                "text-balance text-[clamp(2rem,3.5vw,3.25rem)] leading-[1.1]",
              )}
            >
              {t("valueTitle")}
            </h2>
            <p className="mt-5 max-w-[36ch] text-base leading-relaxed text-white/60 sm:text-lg">
              {t("valueSubtitle")}
            </p>
            <p className="mt-4 max-w-[34ch] text-base leading-relaxed text-white/45">
              {t("features.easy.desc")}
            </p>
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
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
            </div>
          </Reveal>
        </div>
      </SectionShell>
    </section>
  );
}
