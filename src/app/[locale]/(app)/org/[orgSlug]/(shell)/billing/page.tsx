import { getTranslations } from "next-intl/server";

import { BillingOverviewPanel } from "@/components/billing/billing-overview";
import { orgPath } from "@/lib/org-path";
import { redirect } from "@/i18n/navigation";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { AccessError } from "@/server/permissions/enforce";
import { billingService } from "@/server/services/billing.service";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  const t = await getTranslations("billing");
  const session = await requireAuth();
  const organization = await getOrganizationBySlug(session.user.id, orgSlug);

  let overview;

  try {
    overview = await billingService.getBillingOverview(
      session.user.id,
      organization.id,
    );
  } catch (error) {
    if (error instanceof AccessError) {
      if (error.code === "PERMISSION_DENIED" || error.code === "ORG_FORBIDDEN") {
        redirect({ href: orgPath(orgSlug, "/dashboard"), locale });
      }
      if (error.code === "ORG_NOT_FOUND") {
        redirect({ href: "/forbidden", locale });
      }
    }
    throw error;
  }

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
