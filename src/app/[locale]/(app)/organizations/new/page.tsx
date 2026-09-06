import { PlatformRole } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { CreateOrganizationForm } from "@/components/organization/create-organization-form";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirectToActiveOrganizationDashboard } from "@/server/auth/organization-guard";
import { requireAuth } from "@/server/auth/session";

type NewOrganizationPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NewOrganizationPage({ params }: NewOrganizationPageProps) {
  const { locale } = await params;
  const session = await requireAuth();

  if (session.user.platformRole !== PlatformRole.ADMIN) {
    await redirectToActiveOrganizationDashboard(locale, session.user.id);
  }

  const t = await getTranslations("organizations");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-12">
      <div className="mb-8">
        <Logo variant="full" size="lg" priority />
      </div>
      <Card className="surface-elevated w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("newTitle")}</CardTitle>
          <CardDescription>{t("newSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
