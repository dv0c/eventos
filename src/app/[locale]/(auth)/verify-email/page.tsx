import { getTranslations } from "next-intl/server";

import { AuthGlassPanel } from "@/components/auth/auth-glass-panel";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const t = await getTranslations("auth");
  const { token } = await searchParams;

  return (
    <AuthGlassPanel
      title={t("verifyEmailTitle")}
      subtitle={t("verifyEmailSubtitle")}
      showLogo={false}
    >
      <VerifyEmailForm token={token ?? ""} />
    </AuthGlassPanel>
  );
}
