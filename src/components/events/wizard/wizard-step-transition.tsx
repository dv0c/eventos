"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type WizardTransitionDirection = "forward" | "backward";

interface WizardStepTransitionProps {
  transitionKey: string;
  direction: WizardTransitionDirection;
  children: ReactNode;
  className?: string;
}

export function WizardStepTransition({
  transitionKey,
  direction,
  children,
  className,
}: WizardStepTransitionProps) {
  return (
    <div
      key={transitionKey}
      className={cn(
        direction === "forward"
          ? "wizard-step-enter-forward"
          : "wizard-step-enter-backward",
        className,
      )}
    >
      {children}
    </div>
  );
}
