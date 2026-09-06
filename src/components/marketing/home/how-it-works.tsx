"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import {
  AlbumDesktopMockup,
  AlbumPhoneMockup,
  LiveWallMockup,
  QrShareMockup,
} from "./product-mockups";
import { Reveal, SectionShell } from "./reveal";

export function HomeHowItWorks() {
  const t = useTranslations("marketing.home");

  return (
    <section id="how-it-works" className="border-y border-white/10 bg-black/20 py-20 sm:py-28">
      <SectionShell>
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("howTitle")}</h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">{t("howSubtitle")}</p>
        </Reveal>

        <div className="mt-16 space-y-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">
                {t("how.step1.label")}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {t("how.step1.title")}
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {t("how.step1.desc")}
              </p>
              <Button variant="gold" className="mt-6 rounded-xl" asChild>
                <Link href="/register">{t("how.step1.cta")}</Link>
              </Button>
            </Reveal>
            <Reveal delay={0.1}>
              <AlbumPhoneMockup />
            </Reveal>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal className="order-2 lg:order-1">
              <QrShareMockup />
            </Reveal>
            <Reveal delay={0.1} className="order-1 lg:order-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">
                {t("how.step2.label")}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {t("how.step2.title")}
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {t("how.step2.desc")}
              </p>
              <ul className="mt-5 space-y-2.5">
                {(["link", "qr", "noApp"] as const).map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{t(`how.step2.bullets.${bullet}`)}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">
                {t("how.step3.label")}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {t("how.step3.title")}
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {t("how.step3.desc")}
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-xl border-white/20 bg-black/35 backdrop-blur-sm"
                asChild
              >
                <Link href="/features">{t("how.step3.cta")}</Link>
              </Button>
            </Reveal>
            <Reveal delay={0.1}>
              <LiveWallMockup />
            </Reveal>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal className="order-2 lg:order-1">
              <AlbumDesktopMockup />
            </Reveal>
            <Reveal delay={0.1} className="order-1 lg:order-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">
                {t("how.step4.label")}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {t("how.step4.title")}
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {t("how.step4.desc")}
              </p>
              <ul className="mt-5 space-y-2.5">
                {(["album", "download"] as const).map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{t(`how.step4.bullets.${bullet}`)}</span>
                  </li>
                ))}
              </ul>
              <Button variant="gold" className="mt-6 rounded-xl" asChild>
                <Link href="/register">{t("how.step4.cta")}</Link>
              </Button>
            </Reveal>
          </div>
        </div>
      </SectionShell>
    </section>
  );
}
