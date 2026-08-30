"use client";

import {
  BarChart3,
  Calendar,
  LayoutGrid,
  Mail,
  Sparkles,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { key: "featureGuests", descKey: "featureGuestsDesc", icon: Users },
  { key: "featureInvitations", descKey: "featureInvitationsDesc", icon: Mail },
  { key: "featureSeating", descKey: "featureSeatingDesc", icon: LayoutGrid },
  { key: "featureTimeline", descKey: "featureTimelineDesc", icon: Calendar },
  { key: "featureAnalytics", descKey: "featureAnalyticsDesc", icon: BarChart3 },
  { key: "featureTeam", descKey: "featureTeamDesc", icon: Sparkles },
] as const;

export default function FeaturesPage() {
  const t = useTranslations("marketing");

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t("featuresTitle")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("featuresSubtitle")}</p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ key, descKey, icon: Icon }) => (
          <Card key={key} className="surface-elevated transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{t(key)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(descKey)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
