import { getTranslations } from "next-intl/server";

import { CreateOrganizationForm } from "@/components/organization/create-organization-form";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewOrganizationPage() {
  const t = await getTranslations("organizations");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-12">
      <div className="mb-8">
        <Logo variant="full" size="lg" priority />
      </div>
      <Card className="surface-elevated w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("newTitle")}</CardTitle>
          <CardDescription>{t("newSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
