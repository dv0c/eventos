import { BarChart3 } from "lucide-react";

import { PhaseEmptyPage } from "@/components/shared/phase-empty-page";
import { orgPath } from "@/lib/org-path";

export default async function EventAnalyticsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; eventId: string }>;
}) {
  const { orgSlug, eventId } = await params;

  return (
    <PhaseEmptyPage
      icon={BarChart3}
      titleKey="comingSoonTitle"
      descriptionKey="comingSoonDesc"
      action={{
        labelKey: "backToOverview",
        href: orgPath(orgSlug, `/events/${eventId}/overview`),
      }}
    />
  );
}
