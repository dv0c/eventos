"use client";

import type { WizardStepId } from "@/components/events/wizard/event-type-config";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  steps: WizardStepId[];
  currentStep: number;
  stepLabels: Record<WizardStepId, string>;
}

export function WizardProgress({
  steps,
  currentStep,
  stepLabels,
}: WizardProgressProps) {
  const currentStepId = steps[currentStep];
  const currentLabel = stepLabels[currentStepId];
  const progressRatio =
    steps.length <= 1 ? 1 : currentStep / (steps.length - 1);
  const progressPercent = `${progressRatio * 100}%`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span key={currentStepId} className="wizard-form-section-enter font-medium">
          {currentLabel}
        </span>
        <span className="tabular-nums">
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={currentStep + 1}
        aria-label={currentLabel}
        className="relative flex h-5 w-full items-center"
      >
        <div className="absolute inset-x-0 h-1 rounded-full bg-secondary" />
        <div
          className="wizard-track-progress absolute left-0 h-1 rounded-full bg-primary"
          style={{ width: progressPercent }}
        />
        {steps.map((stepId, index) => {
          const position =
            steps.length <= 1 ? 50 : (index / (steps.length - 1)) * 100;
          const isComplete = index <= currentStep;

          return (
            <span
              key={stepId}
              aria-hidden
              className={cn(
                "absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300",
                isComplete ? "bg-primary" : "bg-border",
              )}
              style={{ left: `${position}%` }}
            />
          );
        })}
        <span
          aria-hidden
          className="wizard-track-progress absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_3px] shadow-background"
          style={{ left: progressPercent }}
        />
      </div>
    </div>
  );
}
