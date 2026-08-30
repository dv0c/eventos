import { FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";

export default async function AdminReportsPage() {
  const t = await getTranslations("admin");

  return (
    <EmptyState
      icon={FileText}
      title={t("reports")}
      description={t("reportsDesc")}
    />
  );
}
