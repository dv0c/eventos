import { OrgRole } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { OrgBrandingForm } from "@/components/organization/org-branding-form";
import { OrgPageHeader } from "@/components/organization/org-page-header";
import { Link } from "@/i18n/navigation";
import { orgPath } from "@/lib/org-path";
import { getOrganizationBySlug } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";
import { organizationRepository } from "@/server/repositories/organization.repository";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const t = await getTranslations("settings");
  const session = await requireAuth();
  const resolvedOrg = await getOrganizationBySlug(session.user.id, orgSlug);
  const org = await organizationRepository.findById(resolvedOrg.id);
  const canManage =
    resolvedOrg.role === OrgRole.OWNER || resolvedOrg.role === OrgRole.ADMIN;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      <OrgPageHeader title={t("title")} description={t("subtitle")} />

      {canManage ? (
        <section className="space-y-4 border-b border-white/10 pb-10">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-tight">{t("organization")}</h2>
            <p className="text-sm text-muted-foreground">{t("organizationDesc")}</p>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">{t("orgName")}</dt>
              <dd className="mt-0.5 font-medium">{org?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("mode")}</dt>
              <dd className="mt-0.5 font-medium">{org?.mode ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("plan")}</dt>
              <dd className="mt-0.5 font-medium">{org?.plan.name ?? "—"}</dd>
            </div>
          </dl>
          {org ? (
            <OrgBrandingForm
              organizationId={org.id}
              mode={org.mode}
              initialName={org.name}
              initialBrandName={org.brandName}
              initialLogoUrl={org.logoUrl}
              initialPrimaryColor={org.primaryColor}
              initialSecondaryColor={org.secondaryColor}
              canManage={canManage}
            />
          ) : null}
        </section>
      ) : (
        <section className="space-y-3 border-b border-white/10 pb-10">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-tight">{t("organization")}</h2>
            <p className="text-sm text-muted-foreground">{t("organizationDesc")}</p>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">{t("orgName")}</dt>
              <dd className="mt-0.5 font-medium">{org?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("mode")}</dt>
              <dd className="mt-0.5 font-medium">{org?.mode ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("plan")}</dt>
              <dd className="mt-0.5 font-medium">{org?.plan.name ?? "—"}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="space-y-3 border-b border-white/10 pb-10">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-tight">{t("account")}</h2>
          <p className="text-sm text-muted-foreground">{t("accountDesc")}</p>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("email")}</dt>
            <dd className="mt-0.5 font-medium">{session.user.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("name")}</dt>
            <dd className="mt-0.5 font-medium">{session.user.name ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-2">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-tight">{t("privacy")}</h2>
          <p className="text-sm text-muted-foreground">{t("privacyDesc")}</p>
        </div>
        <Link
          href={orgPath(orgSlug, "/settings/privacy")}
          className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("privacyLink")}
        </Link>
      </section>
    </div>
  );
}
