import { getTranslations } from "next-intl/server";

import { BillingOverviewPanel } from "@/components/billing/billing-overview";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { billingService } from "@/server/services/billing.service";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  const t = await getTranslations("billing");
  const session = await requireAuth();
  const organizationId = (await getOrganizationBySlug(session.user.id, orgSlug)).id;

  const overview = await billingService.getBillingOverview(
    session.user.id,
    organizationId,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <BillingOverviewPanel overview={overview} locale={locale as "el" | "en"} />
    </div>
  );
}
