import { UsersRound } from "lucide-react";

import { PhaseEmptyPage } from "@/components/shared/phase-empty-page";

export default function EventCollaboratorsPage() {
  return (
    <PhaseEmptyPage
      icon={UsersRound}
      titleKey="collaboratorsTitle"
      descriptionKey="collaboratorsDesc"
    />
  );
}
