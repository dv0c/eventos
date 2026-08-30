import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RegisterPage() {
  const t = await getTranslations("auth");

  return (
    <Card className="surface-elevated border-border/60 shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent lg:hidden">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">{t("createAccount")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("registerSubtitle")}</p>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
