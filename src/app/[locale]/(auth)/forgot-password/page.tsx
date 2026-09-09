import { getTranslations } from "next-intl/server";

import { AuthGlassPanel } from "@/components/auth/auth-glass-panel";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <AuthGlassPanel
      title={t("forgotPasswordTitle")}
      subtitle={t("forgotPasswordSubtitle")}
      showLogo={false}
    >
      <ForgotPasswordForm />
    </AuthGlassPanel>
  );
}
