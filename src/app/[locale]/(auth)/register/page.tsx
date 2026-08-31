import { getTranslations } from "next-intl/server";

import { RegisterForm } from "@/components/auth/register-form";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RegisterPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const t = await getTranslations("auth");
  const { callbackUrl } = await searchParams;

  return (
    <Card className="surface-elevated border-border/60 shadow-lg">
      <CardHeader className="text-center">
      <div className="mx-auto mb-4 flex justify-center lg:hidden">
        <Logo variant="mark" size="lg" />
      </div>
        <CardTitle className="text-2xl">{t("createAccount")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("registerSubtitle")}</p>
      </CardHeader>
      <CardContent>
        <RegisterForm callbackUrl={callbackUrl} />
      </CardContent>
    </Card>
  );
}
