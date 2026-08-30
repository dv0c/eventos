"use client";

import { Heart, Sparkles, Target } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  const t = useTranslations("pages.about");

  const values = [
    { icon: Heart, title: t("value1Title"), desc: t("value1Desc") },
    { icon: Sparkles, title: t("value2Title"), desc: t("value2Desc") },
    { icon: Target, title: t("value3Title"), desc: t("value3Desc") },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <p className="text-center leading-relaxed text-muted-foreground">{t("story")}</p>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {values.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="surface-elevated">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
