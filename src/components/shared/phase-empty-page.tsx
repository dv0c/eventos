import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";

interface PhaseEmptyPageProps {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  namespace?: string;
  action?: {
    labelKey: string;
    href: string;
  };
}

export async function PhaseEmptyPage({
  icon,
  titleKey,
  descriptionKey,
  namespace = "phases",
  action,
}: PhaseEmptyPageProps) {
  const t = await getTranslations(namespace);

  return (
    <EmptyState
      icon={icon}
      title={t(titleKey)}
      description={t(descriptionKey)}
      action={
        action
          ? { label: t(action.labelKey), href: action.href }
          : undefined
      }
    />
  );
}
