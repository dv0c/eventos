import { getTranslations } from "next-intl/server";

import { AuthGlassPanel } from "@/components/auth/auth-glass-panel";
import { LoginForm } from "@/components/auth/login-form";
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
    <AuthGlassPanel title={t("welcomeBack")} subtitle={t("loginSubtitle")} showLogo={false}>
      <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} />
    </AuthGlassPanel>
  );
}
