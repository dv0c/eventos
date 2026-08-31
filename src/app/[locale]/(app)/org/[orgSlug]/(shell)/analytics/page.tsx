import { getTranslations } from "next-intl/server";

import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { Card, CardContent } from "@/components/ui/card";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { analyticsService } from "@/server/services/analytics.service";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const t = await getTranslations("analytics");
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;

  const data = await analyticsService.getOrganizationAnalytics(
    session.user.id,
    organizationId,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("totalEvents")}</p>
            <p className="text-2xl font-bold">{data.summary.totalEvents}</p>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("totalGuests")}</p>
            <p className="text-2xl font-bold">{data.summary.totalGuests}</p>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("rsvpRate")}</p>
            <p className="text-2xl font-bold">{data.summary.rsvpRate}%</p>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("photosUploaded")}</p>
            <p className="text-2xl font-bold">{data.summary.photosUploaded}</p>
          </CardContent>
        </Card>
      </div>

      <AnalyticsCharts
        data={data}
        labels={{
          rsvpTitle: t("rsvpChart"),
          messageTitle: t("messageChart"),
          photosTitle: t("photosChart"),
          rate: t("rsvpRate"),
          invited: t("invited"),
          responded: t("responded"),
        }}
      />
    </div>
  );
}
