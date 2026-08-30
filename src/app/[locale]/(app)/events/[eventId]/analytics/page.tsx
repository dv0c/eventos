import { BarChart3 } from "lucide-react";

import { PhaseEmptyPage } from "@/components/shared/phase-empty-page";

export default function EventAnalyticsPage() {
  return (
    <PhaseEmptyPage
      icon={BarChart3}
      titleKey="analyticsTitle"
      descriptionKey="analyticsDesc"
    />
  );
}
