"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import type { WizardStepId } from "@/components/events/wizard/event-type-config";
import { cn } from "@/lib/utils";

interface WizardSideStepsProps {
  steps: WizardStepId[];
  currentStep: number;
  stepLabels: Record<WizardStepId, string>;
}

export function WizardSideSteps({
  steps,
  currentStep,
  stepLabels,
}: WizardSideStepsProps) {
  const t = useTranslations("wizard");
  const currentStepId = steps[currentStep];
  const tip = t(`sideTips.${currentStepId}` as "sideTips.type");

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <ol className="space-y-1">
        {steps.map((stepId, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li key={stepId}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  isCurrent && "bg-primary/10",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isComplete && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground",
                    !isComplete &&
                      !isCurrent &&
                      "border border-border/60 bg-transparent text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {isComplete ? <Check className="size-3.5" strokeWidth={2.5} /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-sm transition-colors",
                    isCurrent && "font-medium text-foreground",
                    isComplete && "text-muted-foreground",
                    !isComplete && !isCurrent && "text-muted-foreground/70",
                  )}
                >
                  {stepLabels[stepId]}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <p
        key={currentStepId}
        className="wizard-form-section-enter px-3 text-sm leading-relaxed text-muted-foreground"
      >
        {tip}
      </p>
    </div>
  );
}
