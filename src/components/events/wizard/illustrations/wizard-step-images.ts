import type { WizardStepId } from "@/components/events/wizard/event-type-config";

export const WIZARD_STEP_IMAGES: Record<WizardStepId, string> = {
  type: "/wizard/wizard-type.png",
  details: "/wizard/wizard-details.png",
  theme: "/wizard/wizard-theme.png",
  games: "/wizard/wizard-theme.png",
  review: "/wizard/wizard-review.png",
};

export const WIZARD_STEP_IMAGE_ALTS: Record<WizardStepId, string> = {
  type: "Person choosing an event type",
  details: "Person writing event details in a planner",
  theme: "Person choosing event colors and theme",
  games: "Guests playing photo challenge games",
  review: "Person celebrating a completed event plan",
};
