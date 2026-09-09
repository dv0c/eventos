import { getTranslations } from "next-intl/server";

import { AuthGlassPanel } from "@/components/auth/auth-glass-panel";
import { SsoCallbackClient } from "@/components/auth/sso-callback-client";

interface SsoCallbackPageProps {
  searchParams: Promise<{
    redirect_url?: string;
    callbackUrl?: string;
    code?: string;
    provider?: string;
    error?: string;
    error_description?: string;
  }>;
}

export default async function SsoCallbackPage({
  searchParams,
}: SsoCallbackPageProps) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const redirectUrl = params.redirect_url ?? params.callbackUrl ?? "/dashboard";
  const hasError = Boolean(params.error || params.error_description);

  return (
    <AuthGlassPanel
      title={hasError ? t("oauthFailedTitle") : t("completingSignIn")}
      subtitle={hasError ? t("oauthFailedSubtitle") : t("pleaseWait")}
      showLogo={false}
    >
      <SsoCallbackClient redirectUrl={redirectUrl} />
    </AuthGlassPanel>
  );
}
