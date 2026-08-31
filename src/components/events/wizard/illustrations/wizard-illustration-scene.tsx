"use client";

import Image from "next/image";

import type { WizardStepId } from "@/components/events/wizard/event-type-config";
import {
  WIZARD_STEP_IMAGE_ALTS,
  WIZARD_STEP_IMAGES,
} from "@/components/events/wizard/illustrations/wizard-step-images";

interface WizardIllustrationSceneProps {
  step: WizardStepId;
}

export function WizardIllustrationScene({ step }: WizardIllustrationSceneProps) {
  return (
    <div key={step} className="wizard-scene-enter w-full max-w-sm">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
        <Image
          src={WIZARD_STEP_IMAGES[step]}
          alt={WIZARD_STEP_IMAGE_ALTS[step]}
          fill
          priority
          sizes="(min-width: 1024px) 28vw, 80vw"
          className="object-contain"
        />
      </div>
    </div>
  );
}
