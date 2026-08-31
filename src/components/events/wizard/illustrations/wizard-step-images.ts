import type { WizardStepId } from "@/components/events/wizard/event-type-config";

export const WIZARD_STEP_IMAGES: Record<WizardStepId, string> = {
  type: "/wizard/wizard-type.png",
  details: "/wizard/wizard-details.png",
  location: "/wizard/wizard-location.png",
  people: "/wizard/wizard-people.png",
  theme: "/wizard/wizard-theme.png",
  review: "/wizard/wizard-review.png",
};

export const WIZARD_STEP_IMAGE_ALTS: Record<WizardStepId, string> = {
  type: "Person choosing an event type",
  details: "Person writing event details in a planner",
  location: "Person looking at a map for the venue",
  people: "People planning guest list together",
  theme: "Person choosing event colors and theme",
  review: "Person celebrating a completed event plan",
};
