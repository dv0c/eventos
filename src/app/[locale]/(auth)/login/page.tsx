import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "@/i18n/navigation";
import { redirectToActiveOrganizationDashboard } from "@/server/auth/organization-guard";
import { getSession } from "@/server/auth/session";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ searchParams, params }: LoginPageProps) {
  const t = await getTranslations("auth");
  const { callbackUrl } = await searchParams;
  const { locale } = await params;
  const session = await getSession();

  if (session?.user?.id) {
    if (callbackUrl) {
      redirect({ href: callbackUrl, locale });
    }

    await redirectToActiveOrganizationDashboard(locale, session.user.id);
  }

  return (
    <Card className="surface-elevated border-border/60 shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex justify-center lg:hidden">
          <Logo variant="mark" size="lg" />
        </div>
        <CardTitle className="text-2xl">{t("welcomeBack")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("loginSubtitle")}</p>
      </CardHeader>
      <CardContent>
        <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} />
      </CardContent>
    </Card>
  );
}
