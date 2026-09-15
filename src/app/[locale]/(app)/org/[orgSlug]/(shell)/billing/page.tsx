import { getTranslations } from "next-intl/server";

import { BillingOverviewPanel } from "@/components/billing/billing-overview";
import { OrgPageHeader } from "@/components/organization/org-page-header";
import { orgPath } from "@/lib/org-path";
import { redirect } from "@/i18n/navigation";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { getFreeEventQuotaState } from "@/server/events/event-entitlement";
import {
  AccessError,
  enforceOrganizationAccess,
} from "@/server/permissions/enforce";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  const t = await getTranslations("billing");
  const session = await requireAuth();
  const organization = await getOrganizationBySlug(session.user.id, orgSlug);

  let quota;

  try {
    await enforceOrganizationAccess(
      session.user.id,
      organization.id,
      "org:manage_billing",
    );
    quota = await getFreeEventQuotaState(session.user.id);
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
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <OrgPageHeader title={t("title")} description={t("subtitle")} />
      <BillingOverviewPanel quota={quota} orgSlug={orgSlug} />
    </div>
  );
}
