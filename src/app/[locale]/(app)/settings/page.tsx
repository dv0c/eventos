import { Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  getActiveOrganizationId,
  requireAuth,
} from "@/server/auth/session";
import { organizationRepository } from "@/server/repositories/organization.repository";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const session = await requireAuth();
  const organizationId = await getActiveOrganizationId();

  const org = organizationId
    ? await organizationRepository.findById(organizationId)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="surface-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t("organization")}
            </CardTitle>
            <CardDescription>{t("organizationDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t("orgName")}: </span>
              {org?.name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">{t("plan")}: </span>
              {org?.plan.name ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="surface-elevated">
          <CardHeader>
            <CardTitle>{t("account")}</CardTitle>
            <CardDescription>{t("accountDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t("email")}: </span>
              {session.user.email}
            </p>
            <p>
              <span className="text-muted-foreground">{t("name")}: </span>
              {session.user.name ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="surface-elevated md:col-span-2">
          <CardHeader>
            <CardTitle>{t("privacy")}</CardTitle>
            <CardDescription>{t("privacyDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/privacy" className="text-sm font-medium text-primary hover:underline">
              {t("privacyLink")}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
