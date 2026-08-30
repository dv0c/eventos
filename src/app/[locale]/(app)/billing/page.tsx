import { CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BillingOverviewPanel } from "@/components/billing/billing-overview";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getActiveOrganizationId,
  requireAuth,
} from "@/server/auth/session";
import { billingService } from "@/server/services/billing.service";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("billing");
  const session = await requireAuth();
  const organizationId = await getActiveOrganizationId();

  if (!organizationId) {
    return (
      <EmptyState icon={CreditCard} title={t("noOrg")} description={t("noOrgDesc")} />
    );
  }

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
