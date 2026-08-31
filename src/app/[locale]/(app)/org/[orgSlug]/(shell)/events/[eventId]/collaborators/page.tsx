import { UsersRound } from "lucide-react";

import { PhaseEmptyPage } from "@/components/shared/phase-empty-page";
import { orgPath } from "@/lib/org-path";

export default async function EventCollaboratorsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; eventId: string }>;
}) {
  const { orgSlug, eventId } = await params;

  return (
    <PhaseEmptyPage
      icon={UsersRound}
      titleKey="comingSoonTitle"
      descriptionKey="collaboratorsDesc"
      action={{
        labelKey: "backToOverview",
        href: orgPath(orgSlug, `/events/${eventId}/overview`),
      }}
    />
  );
}
