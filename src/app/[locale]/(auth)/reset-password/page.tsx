import { getTranslations } from "next-intl/server";

import { AuthGlassPanel } from "@/components/auth/auth-glass-panel";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const t = await getTranslations("auth");
  const { token } = await searchParams;

  return (
    <AuthGlassPanel
      title={t("resetPassword")}
      subtitle={t("resetPasswordSubtitle")}
      showLogo={false}
    >
      <ResetPasswordForm token={token ?? ""} />
    </AuthGlassPanel>
  );
}
