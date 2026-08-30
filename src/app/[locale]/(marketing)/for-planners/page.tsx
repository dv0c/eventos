"use client";

import { CalendarHeart, ClipboardList, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export default function ForPlannersPage() {
  const t = useTranslations("pages.forPlanners");
  const tCommon = useTranslations("common");

  const highlights = [
    { icon: CalendarHeart, title: t("highlight1Title"), desc: t("highlight1Desc") },
    { icon: Users, title: t("highlight2Title"), desc: t("highlight2Desc") },
    { icon: ClipboardList, title: t("highlight3Title"), desc: t("highlight3Desc") },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {highlights.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="surface-elevated">
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Button variant="gold" size="lg" asChild>
          <Link href="/register">{tCommon("getStarted")}</Link>
        </Button>
      </div>
    </div>
  );
}
