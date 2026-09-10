"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { Reveal, marketingDisplayClass } from "./reveal";

export function HomeMidCta() {
  const t = useTranslations("marketing.home");

  return (
    <section className="relative py-8 sm:py-12">
      <Reveal>
        <div className="relative min-h-[360px] overflow-hidden sm:min-h-[420px]">
          <Image
            src="/marketing/demos/album-hero.png"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#120A06]/92 via-[#120A06]/75 to-[#120A06]/45" />

          <div className="relative mx-auto flex min-h-[360px] max-w-7xl flex-col justify-center px-4 py-16 sm:min-h-[420px] sm:px-6 sm:py-20 lg:px-8">
            <h2
              className={cn(
                marketingDisplayClass,
                "max-w-[16ch] text-[clamp(2rem,4vw,3.5rem)] leading-[1.08] text-white",
              )}
            >
              {t("midCtaTitle")}
            </h2>
            <p className="mt-5 max-w-[34ch] text-base leading-relaxed text-white/65 sm:text-lg">
              {t("midCtaSubtitle")}
            </p>
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Button
                variant="gold"
                size="lg"
                className="h-12 rounded-md px-8 text-base font-semibold shadow-none"
                asChild
              >
                <Link href="/register">{t("midCtaPrimary")}</Link>
              </Button>
              <Link
                href="/pricing"
                className="text-[15px] font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {t("midCtaSecondary")}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
