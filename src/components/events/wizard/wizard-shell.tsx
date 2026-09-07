"use client";

import type { EventType } from "@prisma/client";
import type { ReactNode, RefObject } from "react";

import type { WizardStepId } from "@/components/events/wizard/event-type-config";
import { WizardSideSteps } from "@/components/events/wizard/wizard-side-steps";
import {
  WizardStepTransition,
  type WizardTransitionDirection,
} from "@/components/events/wizard/wizard-step-transition";
import { Logo } from "@/components/shared/logo";

interface WizardShellProps {
  step: WizardStepId;
  steps: WizardStepId[];
  currentStep: number;
  stepLabels: Record<WizardStepId, string>;
  eventType?: EventType;
  headline: string;
  subheadline?: string;
  direction: WizardTransitionDirection;
  formScrollRef?: RefObject<HTMLDivElement | null>;
  progress: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}

export function WizardShell({
  step,
  steps,
  currentStep,
  stepLabels,
  headline,
  subheadline,
  direction,
  formScrollRef,
  progress,
  headerActions,
  children,
  footer,
}: WizardShellProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      <div className="relative hidden shrink-0 flex-col justify-between overflow-hidden border-r border-border/30 px-12 py-10 lg:flex lg:h-full lg:w-[42%]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_85%,oklch(0.32_0.05_55/0.14),transparent_65%)]"
        />
        <Logo variant="full" size="sm" theme="light" />

        <div className="relative flex flex-1 flex-col items-center justify-center py-12">
          <WizardSideSteps
            steps={steps}
            currentStep={currentStep}
            stepLabels={stepLabels}
          />
        </div>

        <div className="relative text-sm text-muted-foreground">
          © {new Date().getFullYear()} Eventos
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border/30 px-6 py-5 lg:px-12 lg:py-6">
          <div className="mx-auto w-full max-w-xl space-y-4">
            <div>{headerActions}</div>
            <WizardStepTransition
              transitionKey={step}
              direction={direction}
              className="space-y-1"
            >
              <h1 className="text-xl font-semibold tracking-tight">{headline}</h1>
              {subheadline ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {subheadline}
                </p>
              ) : null}
            </WizardStepTransition>
          </div>
        </div>

        <div
          ref={formScrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-12"
        >
          <div className="mx-auto w-full max-w-xl">{children}</div>
        </div>

        <div className="shrink-0 border-t border-border/40 px-6 py-4 lg:px-12">
          <div className="mx-auto w-full max-w-xl space-y-4">
            {progress}
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
