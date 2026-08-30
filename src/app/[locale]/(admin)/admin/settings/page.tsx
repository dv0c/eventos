import { Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";

export default async function AdminSettingsPage() {
  const t = await getTranslations("admin");

  return (
    <EmptyState
      icon={Settings}
      title={t("settings")}
      description={t("settingsDesc")}
    />
  );
}
