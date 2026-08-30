import { getTranslations } from "next-intl/server";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

interface PhaseEmptyPageProps {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  namespace?: string;
}

export async function PhaseEmptyPage({
  icon,
  titleKey,
  descriptionKey,
  namespace = "phases",
}: PhaseEmptyPageProps) {
  const t = await getTranslations(namespace);

  return (
    <EmptyState
      icon={icon}
      title={t(titleKey)}
      description={t(descriptionKey)}
    />
  );
}
