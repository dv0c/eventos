"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import {
  AlbumPhoneMockup,
  LiveWallMockup,
  QrShareMockup,
} from "@/components/marketing/home/product-mockups";
import { Reveal, SectionIntro, SectionShell } from "@/components/marketing/home/reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const STEPS = [
  { n: "1" as const, visual: "phone" },
  { n: "2" as const, visual: "qr" },
  { n: "3" as const, visual: "upload" },
  { n: "4" as const, visual: "wall" },
];

export default function HowItWorksPage() {
  const t = useTranslations("marketing.evento");

  return (
    <SectionShell className="py-16 sm:py-20">
      <Reveal>
        <SectionIntro
          title={t("howPage.title")}
          description={t("howPage.subtitle")}
          align="center"
          className="mx-auto"
        />
      </Reveal>

      <div className="mt-16 space-y-20 sm:mt-20 sm:space-y-28">
        {STEPS.map((step, i) => (
          <Reveal key={step.n}>
            <div
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-14 ${
                i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="flex justify-center">
                {step.visual === "phone" ? (
                  <AlbumPhoneMockup />
                ) : step.visual === "qr" ? (
                  <QrShareMockup className="border-neutral-200 bg-white shadow-sm" />
                ) : step.visual === "upload" ? (
                  <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-neutral-900/10">
                    <div className="relative aspect-[4/5]">
                      <Image
                        src="/marketing/demos/upload-guest.png"
                        alt=""
                        fill
                        className="object-cover"
                        sizes="400px"
                      />
                    </div>
                  </div>
                ) : (
                  <LiveWallMockup className="w-full" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.14em] text-[#A67C52]">
                  {t(`how.s${step.n}Label`)}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
                  {t(`how.s${step.n}Title`)}
                </h2>
                <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-neutral-600 sm:text-lg">
                  {t(`how.s${step.n}Desc`)}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-16 flex justify-center sm:mt-20">
        <Button variant="gold" size="lg" className="h-12 rounded-lg px-8 font-semibold shadow-none" asChild>
          <Link href="/register">{t("ctaCreate")}</Link>
        </Button>
      </Reveal>
    </SectionShell>
  );
}
