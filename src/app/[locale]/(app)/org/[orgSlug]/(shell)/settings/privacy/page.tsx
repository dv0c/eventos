import { getTranslations } from "next-intl/server";

import { PrivacySettingsForm } from "@/components/privacy/privacy-settings-form";

export default async function PrivacySettingsPage() {
  const t = await getTranslations("privacy");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <PrivacySettingsForm />
    </div>
  );
}
