"use client";

import {
  Captions,
  Images,
  MonitorPlay,
  Smartphone,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { Reveal, SectionShell } from "./reveal";

const FEATURES = [
  { key: "media" as const, icon: Images },
  { key: "captions" as const, icon: Captions },
  { key: "easy" as const, icon: Smartphone },
  { key: "wall" as const, icon: MonitorPlay },
];

export function HomeValueProp() {
  const t = useTranslations("marketing.home");

  return (
    <SectionShell className="pb-20 sm:pb-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("valueTitle")}
        </h2>
        <p className="mt-4 text-muted-foreground sm:text-lg">{t("valueSubtitle")}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="h-11 rounded-xl px-7" asChild>
            <Link href="/register">{t("valueCta")}</Link>
          </Button>
          <Button variant="outline" size="lg" className="h-11 rounded-xl px-7" asChild>
            <Link href="/features">{t("valueDemo")}</Link>
          </Button>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ key, icon: Icon }, i) => (
          <Reveal key={key} delay={i * 0.06}>
            <div className="group h-full rounded-2xl border border-transparent p-1 transition-transform hover:-translate-y-1">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{t(`features.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`features.${key}.desc`)}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
