"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { Reveal, SectionShell } from "./reveal";

export function HomeMidCta() {
  const t = useTranslations("marketing.home");

  return (
    <SectionShell className="py-20 sm:py-24">
      <Reveal>
        <div className="glass-panel relative overflow-hidden border-white/15 bg-black/45 px-6 py-14 text-center backdrop-blur-xl sm:px-12">
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <h2 className="relative text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("midCtaTitle")}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground sm:text-lg">
            {t("midCtaSubtitle")}
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="gold"
              size="lg"
              className="h-12 rounded-xl px-8 text-base"
              asChild
            >
              <Link href="/register">{t("midCtaPrimary")}</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-xl border-white/20 bg-black/35 px-8 text-base hover:bg-white/10"
              asChild
            >
              <Link href="/pricing">{t("midCtaSecondary")}</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}
