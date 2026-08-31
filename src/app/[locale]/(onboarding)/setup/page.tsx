import { getTranslations } from "next-intl/server";

import { CreateOrganizationForm } from "@/components/organization/create-organization-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SetupOrganizationPage() {
  const t = await getTranslations("setup");

  return (
    <Card className="surface-elevated border-border/60 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <CreateOrganizationForm />
      </CardContent>
    </Card>
  );
}
