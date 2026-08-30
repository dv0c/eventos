import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const t = await getTranslations("auth");
  const { callbackUrl } = await searchParams;

  return (
  <Card className="surface-elevated border-border/60 shadow-lg">
    <CardHeader className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent lg:hidden">
        <Sparkles className="h-6 w-6 text-primary-foreground" />
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
