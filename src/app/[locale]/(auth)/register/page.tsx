import { getTranslations } from "next-intl/server";

import { AuthGlassPanel } from "@/components/auth/auth-glass-panel";
import { RegisterForm } from "@/components/auth/register-form";

interface RegisterPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const t = await getTranslations("auth");
  const { callbackUrl } = await searchParams;

  return (
    <AuthGlassPanel title={t("createAccount")} subtitle={t("registerSubtitle")} showLogo={false}>
      <RegisterForm callbackUrl={callbackUrl} />
    </AuthGlassPanel>
  );
}
