"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const CARDS = ["help", "guides", "blog"] as const;

export default function ResourcesPage() {
  const t = useTranslations("marketing.evento.resourcesPage");

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-neutral-600">{t("subtitle")}</p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-3">
        {CARDS.map((key) => (
          <div
            key={key}
            className="rounded-2xl border border-neutral-900/10 bg-white p-6 sm:p-7"
          >
            <h2 className="text-lg font-semibold text-neutral-950">
              {t(`${key}Title`)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {t(`${key}Desc`)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Button variant="gold" className="h-11 rounded-lg px-6 font-semibold shadow-none" asChild>
          <Link href="/contact">{t("cta")}</Link>
        </Button>
      </div>
    </div>
  );
}
